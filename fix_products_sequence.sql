-- Fix products sequence issue
-- Reset sequence to proper value

-- Check current sequence value
SELECT currval('products_id_seq');

-- Get max id from products table
SELECT MAX(id) FROM products;

-- Set sequence to max value
SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 0) + 1, false);

-- Verify
SELECT nextval('products_id_seq');
