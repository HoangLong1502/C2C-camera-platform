// Reset categories table - Delete and let TypeORM recreate
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5440', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '12343',
    database: process.env.DATABASE_NAME || 'camera_web',
});

async function resetCategories() {
    try {
        console.log('🔄 Resetting categories table...\n');
        await client.connect();
        console.log('✅ Connected\n');

        // Check if table exists
        const exists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'categories'
            )
        `);

        if (exists.rows[0].exists) {
            console.log('⚠️  Categories table exists');
            console.log('💡 Option 1: Delete and let TypeORM recreate');
            console.log('💡 Option 2: Fix existing data\n');
            
            // Try to fix first
            console.log('🔧 Attempting to fix...');
            
            // Fix NULL values
            await client.query(`
                UPDATE categories 
                SET name = COALESCE(name, 'Category ' || id::text)
                WHERE name IS NULL
            `);
            
            await client.query(`
                UPDATE categories 
                SET slug = COALESCE(slug, 'category-' || id::text)
                WHERE slug IS NULL
            `);
            
            // Delete any still invalid
            await client.query(`
                DELETE FROM categories 
                WHERE name IS NULL OR slug IS NULL
            `);
            
            // Set NOT NULL constraint
            try {
                await client.query(`ALTER TABLE categories ALTER COLUMN name SET NOT NULL`);
                await client.query(`ALTER TABLE categories ALTER COLUMN slug SET NOT NULL`);
                console.log('✅ Fixed and set constraints');
            } catch (err) {
                console.log('⚠️  Could not set constraints, will delete table');
                await client.query(`DROP TABLE categories CASCADE`);
                console.log('✅ Deleted categories table (TypeORM will recreate)');
            }
        } else {
            console.log('ℹ️  Categories table does not exist (will be created by TypeORM)');
        }

        console.log('\n✅ Ready! TypeORM will create/update categories table');
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

resetCategories();
