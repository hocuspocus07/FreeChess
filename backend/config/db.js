import {Pool} from 'pg'
import dotenv from 'dotenv';

dotenv.config();

console.log("Running in", process.env.NODE_ENV, "mode");
const dbConfig = {
  production: { // For deployed environment
    host: process.env.DEPLOYED_HOST,
    user: process.env.DEPLOYED_USER,
    password: process.env.DEPLOYED_PASSWD,
    database: process.env.DEPLOYED_DB,
    port: process.env.DB_PORT || 5432,
  },
  development: { // For local development
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
  }
};

const currentConfig = process.env.NODE_ENV === 'production' 
  ? dbConfig.production 
  : dbConfig.development;

const pool = new Pool(currentConfig);

async function checkDatabaseConnection() {
  try {
    const res = await pool.query('SELECT 1 + 1 AS solution');
    console.log('Database connected successfully!');
    console.log('Test query result:', res.rows[0].solution); 
  } catch (err) {
    console.error('Error connecting to the database:', err);
    throw err;
  }
}

export { pool, checkDatabaseConnection };