const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const useSsl = process.env.DB_SSL === 'true' || isProduction;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl
    ? {
        rejectUnauthorized: false
      }
    : false
});

pool.on('connect', () => {
  console.log('PostgreSQL connected');
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error', err);
});

module.exports = pool;