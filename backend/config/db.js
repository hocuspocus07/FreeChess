import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

console.log("Running in", process.env.NODE_ENV, "mode");
const dbConfig = {
  production: {
    // For production
    connectionString: process.env.DEPLOYED_URL,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    min: 0,
    idleTimeoutMillis: 60000,
  },
  development: {
    // For local development
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    min: 0,
    idleTimeoutMillis: 60000,
  },
};

const currentConfig =
  process.env.NODE_ENV === "production"
    ? dbConfig.production
    : dbConfig.development;

const pool = new Pool(currentConfig);

async function checkDatabaseConnection() {
  try {
    const res = await pool.query("SELECT 1 + 1 AS solution");
    console.log("Database connected successfully!");
    console.log("Test query result:", res.rows[0].solution);
  } catch (err) {
    console.error("Error connecting to the database:", err);
    throw err;
  }
}

export { pool, checkDatabaseConnection };
