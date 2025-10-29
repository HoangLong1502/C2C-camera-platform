-- Fix NULL id issue in products table
-- Create trigger to prevent NULL id on updates

CREATE OR REPLACE FUNCTION prevent_null_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id = nextval('products_id_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS prevent_null_products_id ON products;

-- Create trigger
CREATE TRIGGER prevent_null_products_id
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION prevent_null_id();

-- Test: Show trigger
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'products';
