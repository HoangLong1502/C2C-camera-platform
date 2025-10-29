-- Create Users table with proper authentication
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

-- Insert admin user with hashed password
-- Password: 123 (hashed with bcrypt)
INSERT INTO users (email, password_hash, role, is_active) VALUES
('admin@admin.com', '$2b$10$rQ6kQ9PJUfxKJTZ9xV7x.eO8MZkK5dZX8Y5K5vX3J9KZJ9xV8ZJ9', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Create sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON users TO postgres;
GRANT ALL PRIVILEGES ON user_sessions TO postgres;
