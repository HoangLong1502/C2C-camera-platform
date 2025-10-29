import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'camera_web',
  password: '12343',
  port: 5440,
});

export default pool;
