#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDocker() {
  return new Promise((resolve) => {
    exec('docker ps', (error) => {
      if (error) {
        log('⚠️  Docker không chạy. Đang kiểm tra...', 'yellow');
        resolve(false);
      } else {
        log('✅ Docker đang chạy', 'green');
        resolve(true);
      }
    });
  });
}

function checkDatabase() {
  return new Promise((resolve) => {
    exec('docker ps | findstr camera_store_db', (error, stdout) => {
      if (error || !stdout.trim()) {
        log('⚠️  Database container chưa chạy', 'yellow');
        resolve(false);
      } else {
        log('✅ Database container đang chạy', 'green');
        resolve(true);
      }
    });
  });
}

function startDatabase() {
  return new Promise((resolve) => {
    log('🚀 Đang khởi động database...', 'cyan');
    const docker = spawn('docker-compose', ['up', '-d', 'postgres'], {
      stdio: 'inherit',
      shell: true,
    });

    docker.on('close', (code) => {
      if (code === 0) {
        log('✅ Database đã khởi động', 'green');
        setTimeout(() => resolve(true), 5000); // Đợi 5 giây để DB sẵn sàng
      } else {
        log('❌ Không thể khởi động database', 'red');
        resolve(false);
      }
    });
  });
}

function checkDependencies(dir) {
  return fs.existsSync(path.join(dir, 'node_modules'));
}

function installDependencies(dir, name) {
  return new Promise((resolve) => {
    log(`📦 Đang cài đặt dependencies cho ${name}...`, 'cyan');
    const npm = spawn('npm', ['install'], {
      cwd: dir,
      stdio: 'inherit',
      shell: true,
    });

    npm.on('close', (code) => {
      if (code === 0) {
        log(`✅ Đã cài đặt dependencies cho ${name}`, 'green');
        resolve(true);
      } else {
        log(`❌ Lỗi khi cài đặt dependencies cho ${name}`, 'red');
        resolve(false);
      }
    });
  });
}

function checkEnvFile() {
  const envPath = path.join(__dirname, 'backend', '.env');
  const envExamplePath = path.join(__dirname, 'backend', 'env.example');

  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    log('📝 Tạo file .env từ env.example...', 'cyan');
    fs.copyFileSync(envExamplePath, envPath);
    log('✅ Đã tạo file .env', 'green');
  }
}

function startServers() {
  log('🚀 Đang khởi động Backend và Frontend...', 'cyan');
  
  // Sử dụng concurrently để chạy cả hai cùng lúc
  // Pass as single command string when using shell: true
  const concurrentlyCommand = 'npx concurrently -n backend,frontend -c blue,green "cd backend && npm run start:dev" "cd frontend && npm run dev"';
  const concurrentlyProcess = spawn(concurrentlyCommand, {
    stdio: 'inherit',
    shell: true,
  });

  concurrentlyProcess.on('error', (error) => {
    log(`❌ Lỗi: ${error.message}`, 'red');
    log('💡 Đang thử cách khác...', 'yellow');
    
    // Fallback: chạy riêng biệt với đúng cwd
    const backend = spawn('npm', ['run', 'start:dev'], {
      cwd: path.join(__dirname, 'backend'),
      stdio: 'inherit',
      shell: true,
    });

    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'inherit',
      shell: true,
    });

    setTimeout(() => {
      log('\n✅ Servers đang chạy:', 'green');
      log('   Backend:  http://localhost:3002/api', 'blue');
      log('   Frontend: http://localhost:3000', 'blue');
    }, 5000);
  });

  setTimeout(() => {
    log('\n✅ Servers đang chạy:', 'green');
    log('   Backend:  http://localhost:3002/api', 'blue');
    log('   Frontend: http://localhost:3000', 'blue');
    log('\n💡 Nhấn Ctrl+C để dừng tất cả servers\n', 'yellow');
  }, 5000);

  // Giữ process chạy
  process.on('SIGINT', () => {
    log('\n\n🛑 Đang dừng servers...', 'yellow');
    concurrentlyProcess.kill('SIGINT');
    process.exit(0);
  });
}

async function main() {
  log('\n========================================', 'cyan');
  log('  🚀 KHỞI ĐỘNG PROJECT', 'cyan');
  log('========================================\n', 'cyan');

  // Kiểm tra Docker
  const dockerRunning = await checkDocker();
  if (!dockerRunning) {
    log('\n⚠️  Vui lòng mở Docker Desktop và chạy lại:', 'yellow');
    log('   npm run start\n', 'yellow');
    process.exit(1);
  }

  // Kiểm tra và khởi động database
  const dbRunning = await checkDatabase();
  if (!dbRunning) {
    const started = await startDatabase();
    if (!started) {
      log('\n❌ Không thể khởi động database. Vui lòng kiểm tra Docker.', 'red');
      process.exit(1);
    }
  }

  // Kiểm tra file .env
  checkEnvFile();

  // Kiểm tra và cài đặt dependencies cho backend
  if (!checkDependencies(path.join(__dirname, 'backend'))) {
    const installed = await installDependencies(path.join(__dirname, 'backend'), 'Backend');
    if (!installed) {
      log('\n❌ Không thể cài đặt dependencies cho Backend', 'red');
      process.exit(1);
    }
  }

  // Kiểm tra và cài đặt dependencies cho frontend
  if (!checkDependencies(path.join(__dirname, 'frontend'))) {
    const installed = await installDependencies(path.join(__dirname, 'frontend'), 'Frontend');
    if (!installed) {
      log('\n❌ Không thể cài đặt dependencies cho Frontend', 'red');
      process.exit(1);
    }
  }

  log('\n========================================', 'cyan');
  log('  ✅ ĐANG KHỞI ĐỘNG SERVERS', 'cyan');
  log('========================================\n', 'cyan');

  // Khởi động Backend và Frontend
  startServers();
}

// Xử lý Ctrl+C
process.on('SIGINT', () => {
  log('\n\n🛑 Đang dừng servers...', 'yellow');
  process.exit(0);
});

main().catch((error) => {
  log(`\n❌ Lỗi: ${error.message}`, 'red');
  process.exit(1);
});
