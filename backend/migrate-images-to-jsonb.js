/**
 * Migration script to convert images column from simple-array to jsonb
 * Run this script after changing the entity from simple-array to jsonb
 */

const process = require('node:process');
const { Client } = require('pg');
require('dotenv').config();

async function migrateImages() {
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

    // Check current column type
    const checkResult = await client.query(`
      SELECT data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'images'
    `);

    if (checkResult.rows.length === 0) {
      console.log('⚠️  Images column does not exist. It will be created by TypeORM.');
      return;
    }

    const currentType = checkResult.rows[0].data_type;
    const udtName = checkResult.rows[0].udt_name;
    console.log(`Current images column type: ${currentType} (${udtName})`);

    // If already jsonb, skip migration
    if (udtName === 'jsonb') {
      console.log('✅ Images column is already jsonb. No migration needed.');
      
      // But we should still migrate existing data if it's in simple-array format
      const products = await client.query('SELECT id, images FROM products WHERE images IS NOT NULL');
      console.log(`Found ${products.rows.length} products with images`);
      
      let migrated = 0;
      for (const product of products.rows) {
        let imagesArray = null;
        
        // If images is already an array (jsonb), skip
        if (Array.isArray(product.images)) {
          continue;
        }
        
        // If it's a string, try to parse or split
        if (typeof product.images === 'string') {
          try {
            // Try JSON parse first
            imagesArray = JSON.parse(product.images);
            if (!Array.isArray(imagesArray)) {
              // If not an array, treat as comma-separated
              imagesArray = product.images.split(',').map(img => img.trim()).filter(img => img.length > 0);
            }
          } catch (_e) {
            // Not JSON, treat as comma-separated
            imagesArray = product.images.split(',').map(img => img.trim()).filter(img => img.length > 0);
          }
        }
        
        if (imagesArray && imagesArray.length > 0) {
          await client.query(
            'UPDATE products SET images = $1::jsonb WHERE id = $2',
            [JSON.stringify(imagesArray), product.id]
          );
          migrated++;
        }
      }
      
      if (migrated > 0) {
        console.log(`✅ Migrated ${migrated} products' images to jsonb format`);
      } else {
        console.log('✅ All images are already in correct format');
      }
      return;
    }

    // Migrate from simple-array/text to jsonb
    console.log('🔄 Migrating images column to jsonb...');

    // Step 1: Add temporary column
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS images_jsonb JSONB
    `);
    console.log('✅ Added temporary jsonb column');

    // Step 2: Migrate data
    const products = await client.query('SELECT id, images FROM products WHERE images IS NOT NULL');
    console.log(`Found ${products.rows.length} products with images`);

    let migrated = 0;
    for (const product of products.rows) {
      let imagesArray = null;
      
      if (typeof product.images === 'string') {
        // Try JSON parse first
        try {
          imagesArray = JSON.parse(product.images);
          if (!Array.isArray(imagesArray)) {
            // If not an array, treat as comma-separated
            imagesArray = product.images.split(',').map(img => img.trim()).filter(img => img.length > 0);
          }
        } catch (_e) {
          // Not JSON, treat as comma-separated (simple-array format)
          imagesArray = product.images.split(',').map(img => img.trim()).filter(img => img.length > 0);
        }
      } else if (Array.isArray(product.images)) {
        imagesArray = product.images;
      }
      
      if (imagesArray && imagesArray.length > 0) {
        await client.query(
          'UPDATE products SET images_jsonb = $1::jsonb WHERE id = $2',
          [JSON.stringify(imagesArray), product.id]
        );
        migrated++;
      }
    }

    console.log(`✅ Migrated ${migrated} products' images`);

    // Step 3: Drop old column and rename new one
    await client.query('ALTER TABLE products DROP COLUMN IF EXISTS images');
    console.log('✅ Dropped old images column');
    
    await client.query('ALTER TABLE products RENAME COLUMN images_jsonb TO images');
    console.log('✅ Renamed images_jsonb to images');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await client.end();
  }
}

migrateImages()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
