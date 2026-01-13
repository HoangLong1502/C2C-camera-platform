const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5440', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '12343',
    database: process.env.DATABASE_NAME || 'camera_web',
});

console.log('Attempting to connect to database...');
console.log('Config:', {
    host: client.host,
    port: client.port,
    user: client.user,
    database: client.database
});

client.connect()
    .then(() => {
        console.log('Successfully connected!');
        return client.query('SELECT current_database(), current_user, version();');
    })
    .then(res => {
        console.log('Database Info:', res.rows[0]);
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection error:', err.stack);
        process.exit(1);
    });
