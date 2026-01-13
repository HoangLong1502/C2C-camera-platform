-- Create enum types
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE product_category AS ENUM ('camera', 'lens', 'accessory');

-- Create Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert categories
INSERT INTO categories (name, slug, icon) VALUES
('Máy ảnh', 'camera', '📷'),
('Ống kính', 'lens', '🔭'),
('Phụ kiện', 'accessory', '🎒'),
('Tất cả', 'all', '🏠')
ON CONFLICT (slug) DO NOTHING;

-- Create Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    image_emoji VARCHAR(10) DEFAULT '📷',
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TRIGGER prevent_null_products_id
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION prevent_null_id();

-- Insert sample products
INSERT INTO products (name, description, price, category_id, image_emoji, stock) VALUES
('Canon EOS R5', 'Full-frame mirrorless camera 45MP', 45990000, (SELECT id FROM categories WHERE slug = 'camera'), '📷', 10),
('Sony A7 IV', 'Full-frame camera 33MP với 4K video', 38990000, (SELECT id FROM categories WHERE slug = 'camera'), '📷', 8),
('Nikon Z6 II', 'Mirrorless camera 24.5MP', 32990000, (SELECT id FROM categories WHERE slug = 'camera'), '📷', 5),
('Canon EF 24-70mm f/2.8', 'Zoom lens chuyên nghiệp', 18990000, (SELECT id FROM categories WHERE slug = 'lens'), '🔭', 15),
('Sony FE 85mm f/1.4', 'Portrait lens chất lượng cao', 22990000, (SELECT id FROM categories WHERE slug = 'lens'), '🔭', 12),
('Tripod Manfrotto', 'Tripod chống rung chuyên nghiệp', 2900000, (SELECT id FROM categories WHERE slug = 'accessory'), '📦', 20),
('Thẻ nhớ SanDisk 128GB', 'Class 10, tốc độ cao', 890000, (SELECT id FROM categories WHERE slug = 'accessory'), '💾', 50),
('Camera Bag Lowepro', 'Túi đựng camera chống nước', 1950000, (SELECT id FROM categories WHERE slug = 'accessory'), '🎒', 25),
('Battery Sony NP-FZ100', 'Pin chính hãng Sony', 1500000, (SELECT id FROM categories WHERE slug = 'accessory'), '🔋', 30),
('LED Video Light', 'Đèn LED 3 màu RGB', 3500000, (SELECT id FROM categories WHERE slug = 'accessory'), '💡', 18),
('Gimbal DJI RS3', 'Gimbal chống rung 3 trục', 8900000, (SELECT id FROM categories WHERE slug = 'accessory'), '📹', 10),
('Canon RF 50mm f/1.2', 'Prime lens độ mở lớn', 42990000, (SELECT id FROM categories WHERE slug = 'lens'), '🔭', 6);

-- Create Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    customer_address TEXT NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_price DECIMAL(12, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Cart Sessions (optional - for guest cart)
CREATE TABLE IF NOT EXISTS cart_sessions (
    id VARCHAR(255) PRIMARY KEY,
    items JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_sessions_updated_at BEFORE UPDATE ON cart_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert admin user (password: 123 hashed)
INSERT INTO users (email, password_hash, role, is_active) VALUES
('admin@admin.com', '-559038737', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Create sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
