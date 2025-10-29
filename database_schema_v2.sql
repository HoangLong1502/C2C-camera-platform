-- ============================================
-- C2C PLATFORM DATABASE SCHEMA
-- ============================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'both', 'admin');
CREATE TYPE product_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'suspended');
CREATE TYPE order_status AS ENUM ('pending', 'payment_received', 'processing', 'shipped', 'delivered', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE commission_status AS ENUM ('pending', 'calculated', 'paid');

-- 2. USER PROFILE EXTENSION
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'buyer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score DECIMAL(3,2) DEFAULT 5.0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_transactions INTEGER DEFAULT 0;

-- 3. PRODUCTS ENHANCEMENT
ALTER TABLE products ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS status product_status DEFAULT 'pending_approval';
ALTER TABLE products ADD COLUMN IF NOT EXISTS condition VARCHAR(50); -- new, used, refurbished
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[]; -- array of image URLs
ALTER TABLE products ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS premium_promotion BOOLEAN DEFAULT FALSE;

-- 4. ORDERS ENHANCEMENT  
ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_id INTEGER REFERENCES users(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS seller_payout DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_status commission_status DEFAULT 'pending';

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    payment_method VARCHAR(50),
    provider VARCHAR(50), -- vnpay, momo, stripe
    transaction_id VARCHAR(255),
    payment_status payment_status DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES users(id),
    buyer_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(3,2) DEFAULT 0.05, -- 5%
    commission_amount DECIMAL(10,2) NOT NULL,
    seller_payout DECIMAL(10,2) NOT NULL,
    platform_revenue DECIMAL(10,2) NOT NULL,
    commission_status commission_status DEFAULT 'pending',
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. REVIEWS & RATINGS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    reviewer_id INTEGER REFERENCES users(id),
    reviewed_user_id INTEGER REFERENCES users(id), -- for seller or buyer
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT[],
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. DISPUTES TABLE
CREATE TABLE IF NOT EXISTS disputes (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    initiator_id INTEGER REFERENCES users(id),
    respondent_id INTEGER REFERENCES users(id),
    reason TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open',
    resolution TEXT,
    admin_id INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. SUBSCRIPTIONS / PREMIUM PACKAGES
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    package_name VARCHAR(100),
    package_type VARCHAR(50), -- monthly, yearly
    price DECIMAL(10,2),
    features JSONB, -- { "max_products": 100, "commission_reduction": 1% }
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    link VARCHAR(500),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. MARKETING & PROMOTIONS
CREATE TABLE IF NOT EXISTS promotions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    seller_id INTEGER REFERENCES users(id),
    promotion_type VARCHAR(50), -- featured, banner, boost
    start_date DATE,
    end_date DATE,
    cost DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. ANALYTICS & REPORTS TABLE
CREATE TABLE IF NOT EXISTS platform_analytics (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE,
    total_users INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_commission DECIMAL(12,2) DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    new_products INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);

-- TRIGGERS for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data
UPDATE users SET role = 'admin' WHERE email = 'admin@admin.com';

-- Commission rate config
CREATE TABLE IF NOT EXISTS platform_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO platform_config (key, value, description) VALUES
('commission_rate', '0.05', 'Default commission rate (5%)'),
('escrow_hold_days', '7', 'Days to hold payment in escrow after delivery'),
('min_product_price', '10000', 'Minimum product price'),
('max_product_images', '10', 'Maximum images per product')
ON CONFLICT (key) DO NOTHING;

