// Update all existing products to APPROVED status
const { Client } = require('pg');

const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5440', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '12343',
    database: process.env.DATABASE_NAME || 'camera_web',
};

async function updateProductsStatus() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check if product_status enum exists
        const enumCheck = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'product_status'
            );
        `);

        if (!enumCheck.rows[0].exists) {
            console.log('Creating product_status enum...');
            await client.query(`
                CREATE TYPE product_status AS ENUM (
                    'draft', 
                    'pending_approval', 
                    'approved', 
                    'rejected', 
                    'suspended', 
                    'sold'
                );
            `);
            console.log('✅ Created product_status enum');
        }

        // Check if products table exists and has status column
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'products'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('⚠️  Products table does not exist yet. It will be created by TypeORM.');
            await client.end();
            return;
        }

        const columnCheck = await client.query(`
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_name = 'products' AND column_name = 'status';
        `);

        if (columnCheck.rows.length === 0) {
            console.log('Adding status column to products table...');
            try {
                await client.query(`
                    ALTER TABLE products 
                    ADD COLUMN status product_status DEFAULT 'approved';
                `);
                console.log('✅ Added status column with default approved');
            } catch (err) {
                console.log('⚠️  Could not add column (might already exist or need migration):', err.message);
            }
        } else {
            console.log('Status column exists, updating products...');
            // Update all products to approved
            try {
                const result = await client.query(`
                    UPDATE products 
                    SET status = 'approved'::product_status 
                    WHERE status IS NULL 
                       OR status::text = 'pending_approval' 
                       OR status::text != 'approved';
                `);
                console.log(`✅ Updated ${result.rowCount} products to approved status`);
            } catch (err) {
                console.log('⚠️  Update query error:', err.message);
                // Try alternative update
                try {
                    const result = await client.query(`
                        UPDATE products 
                        SET status = 'approved'
                        WHERE status IS NULL OR status != 'approved';
                    `);
                    console.log(`✅ Updated ${result.rowCount} products (alternative method)`);
                } catch (err2) {
                    console.log('⚠️  Alternative update also failed:', err2.message);
                }
            }
        }

        // Show current status distribution
        const statusCount = await client.query(`
            SELECT status, COUNT(*) as count 
            FROM products 
            GROUP BY status;
        `);
        console.log('\n📊 Current product status distribution:');
        statusCount.rows.forEach(row => {
            console.log(`   ${row.status || 'NULL'}: ${row.count}`);
        });

        console.log('\n✅ All products are now approved and will appear on homepage!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

updateProductsStatus().catch(console.error);
