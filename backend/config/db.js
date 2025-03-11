import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool to the database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function checkDatabaseConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS solution');
    console.log('Database connected successfully!');
    console.log('Test query result:', rows[0].solution); 
  } catch (err) {
    console.error('Error connecting to the database:', err);
    throw err;
  }
}

export { pool, checkDatabaseConnection };