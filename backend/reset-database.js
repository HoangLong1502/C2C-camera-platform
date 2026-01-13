// Reset database - Drop and recreate database completely
require('dotenv').config();
const { Client } = require('pg');

const dbConfig = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5440', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '12343',
};

const dbName = process.env.DATABASE_NAME || 'camera_web';

async function resetDatabase() {
    const adminClient = new Client({
        ...dbConfig,
        database: 'postgres', // Connect to default database
    });

    try {
        console.log('🔌 Connecting to PostgreSQL...');
        await adminClient.connect();
        console.log('✅ Connected\n');

        console.log('⚠️  WARNING: This will DROP and RECREATE the database!');
        console.log(`   Database: ${dbName}\n`);

        // Terminate all connections to the database
        console.log('🔧 Terminating existing connections...');
        await adminClient.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = $1 AND pid <> pg_backend_pid()
        `, [dbName]);
        console.log('   ✅ Connections terminated\n');

        // Drop database
        console.log(`🗑️  Dropping database: ${dbName}...`);
        await adminClient.query(`DROP DATABASE IF EXISTS ${dbName}`);
        console.log('   ✅ Database dropped\n');

        // Create database
        console.log(`🔨 Creating database: ${dbName}...`);
        await adminClient.query(`CREATE DATABASE ${dbName}`);
        console.log('   ✅ Database created\n');

        await adminClient.end();

        console.log('✅ Database reset completed!');
        console.log('🚀 Start backend now: npm run start:dev');
        console.log('   TypeORM will create all tables with correct schema');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await adminClient.end();
        process.exit(1);
    }
}

resetDatabase();
