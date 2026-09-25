require("dotenv").config();

const { Pool } = require("pg");

console.log("Attempting to connect to database...");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Configure it in your .env file.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log("Pool created with DATABASE_URL (credentials redacted).");

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Database connection error:", err.message);
    console.error("Error stack:", err.stack);
    process.exit(1);
  } else {
    console.log("Database connected successfully!");
    console.log(res.rows);
  }
  pool.end();
});