// Ensure .env file has correct PORT=3002
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'env.example');

let envContent = '';

// Read existing .env or create from example
if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📄 Found existing .env file');
} else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
    console.log('📄 Creating .env from env.example');
} else {
    // Create default .env
    envContent = `# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5440
DATABASE_USER=postgres
DATABASE_PASSWORD=12343
DATABASE_NAME=camera_web

# Server Configuration
PORT=3002
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000
`;
    console.log('📄 Creating default .env file');
}

// Ensure PORT=3002
const lines = envContent.split('\n');
let hasPort = false;
let portLineIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('PORT=')) {
        hasPort = true;
        portLineIndex = i;
        break;
    }
}

if (hasPort) {
    // Update existing PORT line
    lines[portLineIndex] = 'PORT=3002';
    console.log('✅ Updated PORT to 3002');
} else {
    // Add PORT if not exists
    // Find where to insert (after NODE_ENV or at end)
    let insertIndex = lines.length;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('NODE_ENV')) {
            insertIndex = i + 1;
            break;
        }
    }
    lines.splice(insertIndex, 0, 'PORT=3002');
    console.log('✅ Added PORT=3002');
}

// Write back
const newContent = lines.join('\n');
fs.writeFileSync(envPath, newContent, 'utf8');

console.log('\n✅ .env file is ready!');
console.log('   PORT=3002 is set');
console.log('\n🚀 You can now start backend: npm run start:dev');
