/**
 * Migration script to update product_condition enum in PostgreSQL
 * Adds new values: like_new, old, damaged
 */

const process = require('node:process');
const { Client } = require('pg');
require('dotenv').config();

async function updateConditionEnum() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'c2c_platform',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Find the actual enum name used by products table
    const enumNameResult = await client.query(`
      SELECT udt_name
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'condition'
    `);

    if (enumNameResult.rows.length === 0) {
      console.log('⚠️  Products table does not have condition column');
      return;
    }

    const enumName = enumNameResult.rows[0].udt_name;
    console.log(`✅ Found enum type: ${enumName}`);

    // Check current enum values
    const currentValues = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = $1)
      ORDER BY enumsortorder
    `, [enumName]);
    
    console.log('Current enum values:', currentValues.rows.map(r => r.enumlabel));
    
    // Add new values if they don't exist
    const requiredValues = ['like_new', 'old', 'damaged'];
    const existingValues = currentValues.rows.map(r => r.enumlabel);
    
    for (const value of requiredValues) {
      if (!existingValues.includes(value)) {
        try {
          await client.query(`
            ALTER TYPE ${enumName} ADD VALUE IF NOT EXISTS '${value}'
          `);
          console.log(`✅ Added enum value: ${value}`);
        } catch (error) {
          // IF NOT EXISTS might not work in all PostgreSQL versions
          if (error.message.includes('already exists')) {
            console.log(`ℹ️  Enum value ${value} already exists`);
          } else {
            console.error(`❌ Error adding ${value}:`, error.message);
          }
        }
      } else {
        console.log(`ℹ️  Enum value ${value} already exists`);
      }
    }

    // Check if products table uses the enum
    const tableCheck = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'products' AND column_name = 'condition'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Products table has condition column');
      console.log('Column type:', tableCheck.rows[0].data_type, tableCheck.rows[0].udt_name);
      
      // Update existing data if needed (convert old values to new ones)
      // Map: refurbished -> like_new (or you can choose another mapping)
      const enumName = tableCheck.rows[0].udt_name;
      const updateResult = await client.query(`
        UPDATE products 
        SET condition = 'like_new'::${enumName} 
        WHERE condition::text = 'refurbished'
      `);
      
      if (updateResult.rowCount > 0) {
        console.log(`✅ Updated ${updateResult.rowCount} products from 'refurbished' to 'like_new'`);
      }
    } else {
      console.log('⚠️  Products table does not have condition column (will be created by TypeORM)');
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

updateConditionEnum()
  .then(() => {
    console.log('\n✅ Enum update script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Enum update failed:', error);
    process.exit(1);
  });
