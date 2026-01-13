// Pre-start fix - Run this BEFORE starting backend
// This ensures database is ready for TypeORM sync

require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5440', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '12343',
    database: process.env.DATABASE_NAME || 'camera_web',
});

async function preStartFix() {
    try {
        console.log('🔧 Pre-start database fix...\n');
        await client.connect();
        console.log('✅ Connected\n');

        // Fix categories - ensure no NULL values
        const catTableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'categories'
            )
        `);

        if (catTableExists.rows[0].exists) {
            console.log('🔧 Fixing categories...');
            
            // Ensure all categories have valid name and slug
            await client.query(`
                UPDATE categories 
                SET 
                    name = COALESCE(NULLIF(name, ''), 'Category ' || id::text),
                    slug = COALESCE(
                        NULLIF(slug, ''),
                        LOWER(REGEXP_REPLACE(
                            COALESCE(NULLIF(name, ''), 'category-' || id::text), 
                            '[^a-z0-9]+', '-', 'g'
                        ))
                    )
                WHERE name IS NULL OR name = '' OR slug IS NULL OR slug = ''
            `);

            // Delete any remaining invalid categories
            await client.query(`
                DELETE FROM categories 
                WHERE name IS NULL OR name = '' OR slug IS NULL OR slug = ''
            `);

            // Verify
            const verify = await client.query(`
                SELECT COUNT(*) as count 
                FROM categories 
                WHERE name IS NULL OR name = '' OR slug IS NULL OR slug = ''
            `);
            
            if (parseInt(verify.rows[0].count) === 0) {
                console.log('   ✅ Categories are valid');
            } else {
                console.log(`   ⚠️  ${verify.rows[0].count} invalid categories remain`);
            }
        }

        // Ensure name column allows NOT NULL (if it exists)
        try {
            await client.query(`
                ALTER TABLE categories 
                ALTER COLUMN name SET NOT NULL
            `);
            console.log('   ✅ name column is NOT NULL');
        } catch (err) {
            if (err.code !== '42710' && err.message.indexOf('already') === -1) {
                // Ignore "column is already NOT NULL" errors
            }
        }

        // Ensure slug column allows NOT NULL (if it exists)
        try {
            await client.query(`
                ALTER TABLE categories 
                ALTER COLUMN slug SET NOT NULL
            `);
            console.log('   ✅ slug column is NOT NULL');
        } catch (err) {
            if (err.code !== '42710' && err.message.indexOf('already') === -1) {
                // Ignore "column is already NOT NULL" errors
            }
        }

        console.log('\n✅ Pre-start fix completed!');
        console.log('🚀 Database is ready for TypeORM sync');
        
        await client.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await client.end();
        process.exit(1);
    }
}

preStartFix();
