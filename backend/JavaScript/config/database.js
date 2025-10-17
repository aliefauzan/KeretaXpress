import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection - only log once
let isFirstConnection = true;
pool.on('connect', () => {
  if (isFirstConnection) {
    console.log('✓ Database connection pool initialized');
    isFirstConnection = false;
  }
});

pool.on('error', (err) => {
  console.error('✗ Unexpected error on idle database client:', err);
  process.exit(-1);
});

export default pool;
