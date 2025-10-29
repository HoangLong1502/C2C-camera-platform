import pool from './config.js';

// Get all products
export const getAllProducts = async (categoryId = null, searchQuery = '') => {
  let query = 'SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon FROM products p JOIN categories c ON p.category_id = c.id WHERE p.is_active = true';
  const params = [];

  if (categoryId && categoryId !== 'all') {
    query += ' AND p.category_id = $1';
    params.push(categoryId);
  }

  if (searchQuery) {
    query += searchQuery ? ' AND p.name ILIKE $' + (params.length + 1) : '';
    params.push(`%${searchQuery}%`);
  }

  query += ' ORDER BY p.created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
};

// Get product by ID
export const getProductById = async (id) => {
  const result = await pool.query(
    'SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = $1 AND p.is_active = true',
    [id]
  );
  return result.rows[0];
};

// Get all categories
export const getAllCategories = async () => {
  const result = await pool.query('SELECT * FROM categories ORDER BY id');
  return result.rows;
};

// Create new order
export const createOrder = async (orderData) => {
  const { customer_name, customer_phone, customer_email, customer_address, total_price, items } = orderData;

  try {
    // Begin transaction
    await pool.query('BEGIN');

    // Insert order
    const orderResult = await pool.query(
      `INSERT INTO orders (customer_name, customer_phone, customer_email, customer_address, total_price, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [customer_name, customer_phone, customer_email, customer_address, total_price]
    );

    const order = orderResult.rows[0];

    // Insert order items
    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.id, item.id, item.name, item.price, item.quantity, item.price * item.quantity]
      );

      // Update stock (optional)
      await pool.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }

    // Commit transaction
    await pool.query('COMMIT');

    return order;
  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    throw error;
  }
};

// Get all orders
export const getAllOrders = async () => {
  const result = await pool.query(
    `SELECT o.*, 
     (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
     FROM orders o 
     ORDER BY o.created_at DESC`
  );
  return result.rows;
};

// Get order by ID
export const getOrderById = async (id) => {
  const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
  
  if (orderResult.rows.length === 0) {
    return null;
  }

  const itemsResult = await pool.query(
    'SELECT * FROM order_items WHERE order_id = $1',
    [id]
  );

  return {
    ...orderResult.rows[0],
    items: itemsResult.rows
  };
};

// Update order status
export const updateOrderStatus = async (id, status) => {
  const result = await pool.query(
    'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
};

// Get products by category slug
export const getProductsByCategorySlug = async (slug) => {
  const result = await pool.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug, c.icon as category_icon 
     FROM products p 
     JOIN categories c ON p.category_id = c.id 
     WHERE c.slug = $1 AND p.is_active = true
     ORDER BY p.created_at DESC`,
    [slug]
  );
  return result.rows;
};

export default {
  getAllProducts,
  getProductById,
  getAllCategories,
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getProductsByCategorySlug
};
