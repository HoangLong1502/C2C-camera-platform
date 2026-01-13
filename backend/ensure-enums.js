// Ensure enum types exist in database
const { Client } = require('pg');

const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5440', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '12343',
    database: process.env.DATABASE_NAME || 'camera_web',
};

async function ensureEnums() {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check and create product_condition enum
        const conditionCheck = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'product_condition'
            );
        `);
        
        if (!conditionCheck.rows[0].exists) {
            console.log('Creating product_condition enum...');
            await client.query(`
                CREATE TYPE product_condition AS ENUM ('new', 'used', 'refurbished');
            `);
            console.log('✅ Created product_condition enum');
        } else {
            console.log('✅ product_condition enum exists');
        }

        // Check and create product_status enum
        const statusCheck = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type WHERE typname = 'product_status'
            );
        `);
        
        if (!statusCheck.rows[0].exists) {
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
        } else {
            console.log('✅ product_status enum exists');
        }

        console.log('\n✅ All enum types are ready!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

ensureEnums().catch(console.error);
