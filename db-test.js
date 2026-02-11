require("dotenv").config();

const { Pool } = require("pg");

console.log("Attempting to connect to database...");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "sari_sari_store",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
});

console.log("Pool created with config:", {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "sari_sari_store",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD ? "[REDACTED]" : "password",
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
    console.error('Error stack:', err.stack);
  } else {
    console.log('Database connected successfully!');
    console.log(res.rows);
  }
  pool.end();
});