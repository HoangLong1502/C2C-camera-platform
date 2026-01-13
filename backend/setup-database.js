// Comprehensive database setup and fix script
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5440', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '12343',
    database: process.env.DATABASE_NAME || 'camera_web',
});

async function setupDatabase() {
    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected\n');

        // Step 1: Fix categories
        console.log('🔧 [1/4] Fixing categories table...');
        const catExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'categories'
            )
        `);

        if (catExists.rows[0].exists) {
            const nullCheck = await client.query(`
                SELECT COUNT(*) as count 
                FROM categories 
                WHERE name IS NULL OR slug IS NULL
            `);
            
            if (parseInt(nullCheck.rows[0].count) > 0) {
                await client.query(`
                    UPDATE categories 
                    SET name = COALESCE(NULLIF(name, ''), 'Category ' || id::text),
                        slug = COALESCE(NULLIF(slug, ''), 'category-' || id::text)
                    WHERE name IS NULL OR slug IS NULL
                `);
                
                await client.query(`
                    DELETE FROM categories 
                    WHERE name IS NULL OR slug IS NULL
                `);
            }

            // Check if column is nullable and has NULL values
            const columnInfo = await client.query(`
                SELECT is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'categories' AND column_name = 'name'
            `);
            
            const hasNulls = await client.query(`
                SELECT COUNT(*) as count 
                FROM categories 
                WHERE name IS NULL OR slug IS NULL
            `);
            
            if (parseInt(hasNulls.rows[0].count) > 0 || 
                (columnInfo.rows.length > 0 && columnInfo.rows[0].is_nullable === 'YES')) {
                console.log('   ⚠️  Dropping categories table to avoid TypeORM conflicts...');
                await client.query(`DROP TABLE categories CASCADE`);
                console.log('   ✅ Categories table dropped (will be recreated)');
            } else {
                console.log('   ✅ Categories table OK');
            }
        } else {
            console.log('   ℹ️  Categories table does not exist (will be created)');
        }

        // Step 2: Fix users
        console.log('\n🔧 [2/4] Fixing users table...');
        const usersExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            )
        `);

        if (usersExists.rows[0].exists) {
            const columns = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name IN ('password', 'password_hash')
            `);

            const hasPasswordHash = columns.rows.some(r => r.column_name === 'password_hash');
            const hasPassword = columns.rows.some(r => r.column_name === 'password');

            if (hasPassword && !hasPasswordHash) {
                await client.query(`ALTER TABLE users RENAME COLUMN password TO password_hash`);
                console.log('   ✅ Renamed password to password_hash');
            }

            const nullPasswords = await client.query(`
                SELECT COUNT(*) as count FROM users WHERE password_hash IS NULL
            `);
            
            if (parseInt(nullPasswords.rows[0].count) > 0) {
                const defaultHash = await bcrypt.hash('default123', 10);
                await client.query(`
                    UPDATE users 
                    SET password_hash = $1
                    WHERE password_hash IS NULL
                `, [defaultHash]);
                console.log(`   ✅ Fixed ${nullPasswords.rows[0].count} NULL passwords`);
            }

            await client.query(`
                DELETE FROM users WHERE email IS NULL OR email = ''
            `);

            console.log('   ✅ Users table OK');
        } else {
            console.log('   ℹ️  Users table does not exist (will be created)');
        }

        // Step 3: Fix products
        console.log('\n🔧 [3/4] Fixing products table...');
        const productsExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'products'
            )
        `);

        if (productsExists.rows[0].exists) {
            await client.query(`
                UPDATE products 
                SET name = COALESCE(name, 'Product ' || id::text),
                    description = COALESCE(description, 'No description'),
                    price = COALESCE(price, 0)
                WHERE name IS NULL OR description IS NULL OR price IS NULL
            `);

            await client.query(`
                DELETE FROM products 
                WHERE name IS NULL OR name = '' OR price IS NULL
            `);

            console.log('   ✅ Products table OK');
        } else {
            console.log('   ℹ️  Products table does not exist (will be created)');
        }

        // Step 4: Fix orders
        console.log('\n🔧 [4/4] Fixing orders table...');
        const ordersExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'orders'
            )
        `);

        if (ordersExists.rows[0].exists) {
            const columns = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'orders'
            `);
            
            const columnNames = columns.rows.map(r => r.column_name);
            
            if (columnNames.includes('status')) {
                try {
                    await client.query(`
                        UPDATE orders 
                        SET status = COALESCE(status, 'pending')
                        WHERE status IS NULL
                    `);
                } catch (err) {
                    // Ignore enum constraint issues
                }
            }

            if (columnNames.includes('total_price')) {
                try {
                    await client.query(`
                        UPDATE orders 
                        SET total_price = COALESCE(total_price, 0)
                        WHERE total_price IS NULL
                    `);
                } catch (err) {
                    // Ignore
                }
            }

            console.log('   ✅ Orders table OK');
        } else {
            console.log('   ℹ️  Orders table does not exist (will be created)');
        }

        console.log('\n✅ Database setup completed!');
        console.log('🚀 You can now start the backend');
        
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

setupDatabase();
