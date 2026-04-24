// Fix products status to approved
const process = require('node:process');
const { Client } = require('pg');

const config = {
    host: 'localhost',
    port: 5440,
    user: 'postgres',
    password: '12343',
    database: 'camera_web',
};

async function fixStatus() {
    const client = new Client(config);
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('✅ Connected to database');

        // First check current status
        const beforeCheck = await client.query(`
            SELECT status, COUNT(*) as count 
            FROM products 
            GROUP BY status;
        `);
        console.log('\n📊 Before update:');
        beforeCheck.rows.forEach(row => {
            console.log(`   ${row.status}: ${row.count} products`);
        });

        // Update all pending_approval to approved
        console.log('\nUpdating products...');
        const result = await client.query(`
            UPDATE products 
            SET status = 'approved'::product_status 
            WHERE status::text = 'pending_approval';
        `);
        console.log(`✅ Updated ${result.rowCount} products to approved status`);

        // Show current status after update
        const afterCheck = await client.query(`
            SELECT status, COUNT(*) as count 
            FROM products 
            GROUP BY status;
        `);
        console.log('\n📊 After update:');
        afterCheck.rows.forEach(row => {
            console.log(`   ${row.status}: ${row.count} products`);
        });

        console.log('\n✅ Done! Products should now appear on homepage.');
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    } finally {
        await client.end();
    }
}

fixStatus();
