import express from 'express';
import cors from 'cors';
import * as queries from './database/queries.js';

// Simple password hash for development
const hashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

// Import auth functions
import pool from './database/config.js';

const authenticateUser = async (email, password) => {
  try {
    const passwordHash = hashPassword(password);
    const result = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE email = $1 AND password_hash = $2 AND is_active = TRUE',
      [email, passwordHash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
};

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    const products = await queries.getAllProducts(category, search);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await queries.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await queries.getAllCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order
app.post('/api/orders', async (req, res) => {
  try {
    const order = await queries.createOrder(req.body);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await queries.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await queries.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await queries.updateOrderStatus(req.params.id, status);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await authenticateUser(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate simple token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected routes middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Simple token check - in production use JWT
  next();
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, phone, role } = req.body;
    
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email đã tồn tại!' });
    }

    // Hash password
    const passwordHash = hashPassword(password);
    
    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, verified)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, role, full_name`,
      [email, passwordHash, fullName, phone, role]
    );

    res.status(201).json({ 
      user: result.rows[0],
      message: 'Đăng ký thành công!' 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete C2C API endpoints
// Products API
app.get('/api/products/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const result = await pool.query(
      'SELECT * FROM products WHERE seller_id = $1 ORDER BY created_at DESC',
      [sellerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, category_id, seller_id, images, stock, condition } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, description, price, category_id, seller_id, images, stock, condition, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending_approval')
       RETURNING *`,
      [name, description, price, category_id, seller_id, images || [], stock, condition]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/products/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Commission calculation
const calculateCommission = (amount, rate = 0.05) => {
  return amount * rate;
};

app.post('/api/orders', async (req, res) => {
  try {
    const { buyer_id, seller_id, customer_name, customer_phone, customer_address, items } = req.body;
    
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const commission = calculateCommission(totalPrice);
    const finalPrice = totalPrice + commission;
    
    const orderResult = await pool.query(
      `INSERT INTO orders (buyer_id, seller_id, customer_name, customer_phone, customer_address, total_price, commission_amount, status, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'pending')
       RETURNING *`,
      [buyer_id, seller_id, customer_name, customer_phone, customer_address, finalPrice, commission]
    );
    
    const order = orderResult.rows[0];
    
    // Insert order items
    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.id, item.name, item.price, item.quantity, item.price * item.quantity]
      );
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 C2C Platform API ready`);
});
