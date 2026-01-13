-- Quick fix: Update all products to approved status
UPDATE products 
SET status = 'approved'::product_status 
WHERE status::text = 'pending_approval' OR status IS NULL;

-- Check result
SELECT status, COUNT(*) as count 
FROM products 
GROUP BY status;
