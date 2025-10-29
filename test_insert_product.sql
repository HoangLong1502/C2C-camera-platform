-- Test insert product without specifying id
INSERT INTO products (name, description, price, category_id, image_emoji, stock)
VALUES ('Test Product', 'This is a test', 10000000, 2, '📷', 5)
RETURNING id, name, price;

-- Check current products
SELECT id, name, price FROM products ORDER BY id DESC LIMIT 5;
