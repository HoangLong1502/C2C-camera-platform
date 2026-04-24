// Quick test to verify backend can start
const process = require('node:process');
const http = require('http');

console.log('🧪 Testing backend connection...\n');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api',
    method: 'GET',
    timeout: 3000
};

const req = http.request(options, (res) => {
    console.log(`✅ Backend is running!`);
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   URL: http://localhost:3001/api`);
    process.exit(0);
});

req.on('error', (e) => {
    if (e.code === 'ECONNREFUSED') {
        console.log('⚠️  Backend is not running yet');
        console.log('   Start it with: npm run start:dev');
    } else {
        console.log(`❌ Error: ${e.message}`);
    }
    process.exit(1);
});

req.on('timeout', () => {
    console.log('⏱️  Connection timeout');
    req.destroy();
    process.exit(1);
});

req.end();
