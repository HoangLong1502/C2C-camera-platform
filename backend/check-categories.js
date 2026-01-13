const { Client } = require('pg');
require('dotenv').config();

async function checkCategories() {
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

    const result = await client.query('SELECT id, name, slug FROM categories ORDER BY id');
    console.log('\n📋 Current categories:');
    result.rows.forEach(cat => {
      console.log(`  ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}`);
    });

    // Check if we have the required categories
    const requiredCategories = [
      { name: 'Máy ảnh', slug: 'camera' },
      { name: 'Ống kính', slug: 'lens' },
      { name: 'Phụ kiện', slug: 'accessory' }
    ];

    console.log('\n🔍 Checking required categories...');
    for (const reqCat of requiredCategories) {
      const exists = result.rows.find(cat => cat.slug === reqCat.slug);
      if (!exists) {
        console.log(`⚠️  Missing category: ${reqCat.name} (${reqCat.slug})`);
        // Insert missing category
        const insertResult = await client.query(
          'INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id',
          [reqCat.name, reqCat.slug]
        );
        console.log(`✅ Created category: ${reqCat.name} with ID ${insertResult.rows[0].id}`);
      } else {
        console.log(`✅ Category exists: ${reqCat.name} (ID: ${exists.id})`);
      }
    }

    // Get updated list
    const updatedResult = await client.query('SELECT id, name, slug FROM categories ORDER BY id');
    console.log('\n📋 Updated categories:');
    updatedResult.rows.forEach(cat => {
      console.log(`  ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}`);
    });

    await client.end();
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkCategories()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });
