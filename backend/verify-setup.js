// Verify that everything is set up correctly
const process = require('node:process');
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5440', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '12343',
    database: process.env.DATABASE_NAME || 'camera_web',
});

async function verifySetup() {
    const issues = [];
    const successes = [];

    try {
        console.log('🔍 Verifying setup...\n');

        // 1. Check database connection
        try {
            await client.connect();
            successes.push('✅ Database connection successful');
        } catch (err) {
            issues.push(`❌ Cannot connect to database: ${err.message}`);
            console.log('❌ Setup verification failed');
            process.exit(1);
        }

        // 2. Check .env file
        const requiredEnvVars = [
            'DATABASE_HOST',
            'DATABASE_PORT',
            'DATABASE_USER',
            'DATABASE_PASSWORD',
            'DATABASE_NAME',
            'JWT_SECRET',
            'JWT_REFRESH_SECRET'
        ];

        const missingEnv = requiredEnvVars.filter(v => !process.env[v]);
        if (missingEnv.length === 0) {
            successes.push('✅ All required environment variables are set');
        } else {
            issues.push(`❌ Missing environment variables: ${missingEnv.join(', ')}`);
        }

        // 3. Check database tables
        const tables = ['users', 'categories'];
        for (const table of tables) {
            try {
                const exists = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = $1
                    )
                `, [table]);

                if (exists.rows[0].exists) {
                    // Check for NULL values in critical columns
                    if (table === 'categories') {
                        const nullCheck = await client.query(`
                            SELECT COUNT(*) as count 
                            FROM categories 
                            WHERE name IS NULL OR slug IS NULL
                        `);
                        const nullCount = parseInt(nullCheck.rows[0].count);
                        if (nullCount === 0) {
                            successes.push(`✅ ${table} table is OK`);
                        } else {
                            issues.push(`⚠️  ${table} has ${nullCount} rows with NULL values`);
                        }
                    } else if (table === 'users') {
                        const nullCheck = await client.query(`
                            SELECT COUNT(*) as count 
                            FROM users 
                            WHERE password_hash IS NULL
                        `);
                        const nullCount = parseInt(nullCheck.rows[0].count);
                        if (nullCount === 0) {
                            successes.push(`✅ ${table} table is OK`);
                        } else {
                            issues.push(`⚠️  ${table} has ${nullCount} users with NULL passwords`);
                        }
                    }
                } else {
                    successes.push(`ℹ️  ${table} table will be created by TypeORM`);
                }
            } catch (err) {
                issues.push(`❌ Error checking ${table}: ${err.message}`);
            }
        }

        // 4. Check port availability (basic check)
        successes.push('✅ Port check skipped (will be checked when starting server)');

        // Summary
        console.log('\n📊 Verification Results:\n');
        successes.forEach(msg => console.log(msg));
        if (issues.length > 0) {
            console.log('\n⚠️  Issues found:');
            issues.forEach(msg => console.log(msg));
            console.log('\n💡 Run: node fix-all-issues.js to fix these issues');
        }

        if (issues.length === 0) {
            console.log('\n✅ Everything looks good! You can start the backend now:');
            console.log('   npm run start:dev');
        }

        await client.end();
        process.exit(issues.length > 0 ? 1 : 0);
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        await client.end();
        process.exit(1);
    }
}

verifySetup();
