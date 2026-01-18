import pg from 'pg';

const { Pool } = pg;

let pool;

/**
 * Returns a singleton pg Pool using DATABASE_URL.
 */
export function getPool() {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  pool = new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: url.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
  });
  return pool;
}
