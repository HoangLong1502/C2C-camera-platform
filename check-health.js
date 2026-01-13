// Health check script for all services
const { Client } = require('pg');
const http = require('http');

const config = {
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5440', 10),
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || '12343',
        database: process.env.DATABASE_NAME || 'camera_web',
    },
    backend: {
        url: 'http://localhost:3002/api',
        port: 3002,
    },
    frontend: {
        url: 'http://localhost:3000',
        port: 3000,
    },
};

async function checkDatabase() {
    const client = new Client(config.database);
    try {
        await client.connect();
        await client.query('SELECT 1');
        await client.end();
        return { status: 'ok', message: 'Database connected' };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

function checkHttp(url, timeout = 5000) {
    return new Promise((resolve) => {
        const req = http.get(url, { timeout }, (res) => {
            resolve({ status: 'ok', message: `HTTP ${res.statusCode}` });
        });
        
        req.on('error', (error) => {
            resolve({ status: 'error', message: error.message });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({ status: 'error', message: 'Timeout' });
        });
    });
}

async function checkPort(port) {
    return new Promise((resolve) => {
        const server = require('net').createServer();
        
        server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                resolve({ status: 'ok', message: 'Port in use' });
            } else {
                resolve({ status: 'error', message: err.message });
            }
        });
        
        server.once('listening', () => {
            server.close();
            resolve({ status: 'error', message: 'Port not in use' });
        });
        
        server.listen(port);
    });
}

async function main() {
    console.log('🔍 Health Check\n');
    
    // Check Database
    console.log('📊 Database...');
    const dbCheck = await checkDatabase();
    console.log(`   ${dbCheck.status === 'ok' ? '✅' : '❌'} ${dbCheck.message}`);
    
    // Check Backend Port
    console.log('\n🔧 Backend (Port 3002)...');
    const backendPort = await checkPort(3002);
    console.log(`   ${backendPort.status === 'ok' ? '✅' : '❌'} ${backendPort.message}`);
    
    // Check Backend HTTP
    if (backendPort.status === 'ok') {
        const backendHttp = await checkHttp(config.backend.url);
        console.log(`   ${backendHttp.status === 'ok' ? '✅' : '❌'} ${backendHttp.message}`);
    }
    
    // Check Frontend Port
    console.log('\n🌐 Frontend (Port 3000)...');
    const frontendPort = await checkPort(3000);
    console.log(`   ${frontendPort.status === 'ok' ? '✅' : '❌'} ${frontendPort.message}`);
    
    // Check Frontend HTTP
    if (frontendPort.status === 'ok') {
        const frontendHttp = await checkHttp(config.frontend.url);
        console.log(`   ${frontendHttp.status === 'ok' ? '✅' : '❌'} ${frontendHttp.message}`);
    }
    
    console.log('\n✅ Health check completed');
}

main().catch(console.error);
