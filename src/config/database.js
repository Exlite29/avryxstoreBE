const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "..", "sari_sari_store.db");

// Open database
const initializeDatabase = async () => {
  // Initialize SQL.js
  const SQL = await initSqlJs();

  // Load existing database or create new one
  let db;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Helper function to save database to file
  const saveDatabase = () => {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  };

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'cashier',
      store_id INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode VARCHAR(50) UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      unit_price DECIMAL(10, 2) NOT NULL,
      wholesale_price DECIMAL(10, 2),
      stock_quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      image_urls TEXT,
      barcode_image_url VARCHAR(500),
      supplier_id INTEGER,
      expiry_date DATE,
      store_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Inventory table
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      batch_number VARCHAR(100),
      expiry_date DATE,
      location VARCHAR(255),
      store_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sales table
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_number VARCHAR(100) UNIQUE NOT NULL,
      customer_id INTEGER,
      cashier_id INTEGER,
      subtotal DECIMAL(10, 2) NOT NULL,
      discount DECIMAL(10, 2) DEFAULT 0,
      tax DECIMAL(10, 2) DEFAULT 0,
      total_amount DECIMAL(10, 2) NOT NULL,
      payment_method VARCHAR(50),
      payment_received DECIMAL(10, 2),
      change_given DECIMAL(10, 2),
      status VARCHAR(50) DEFAULT 'completed',
      notes TEXT,
      store_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sales items table
  db.run(`
    CREATE TABLE IF NOT EXISTS sales_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER,
      product_id INTEGER,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      discount DECIMAL(10, 2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Barcodes table
  db.run(`
    CREATE TABLE IF NOT EXISTS barcodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode VARCHAR(50) UNIQUE NOT NULL,
      product_id INTEGER,
      barcode_type VARCHAR(50),
      is_primary BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Product scans table
  db.run(`
    CREATE TABLE IF NOT EXISTS product_scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_type VARCHAR(20),
      input_data TEXT,
      product_id INTEGER,
      confidence_score DECIMAL(3, 2),
      scanned_by INTEGER,
      store_id INTEGER,
      device_id VARCHAR(100),
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Transactions table for audit logging
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_type VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INTEGER,
      user_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address VARCHAR(100),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      data TEXT,
      priority VARCHAR(20) DEFAULT 'normal',
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stores table
  db.run(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL,
      address TEXT,
      phone VARCHAR(50),
      owner_id INTEGER,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)",
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)",
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)",
  );
  db.run(
    "CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id)",
  );

  // Save the database
  saveDatabase();

  // Create a wrapper to provide sqlite-like API
  const dbWrapper = {
    db,
    saveDatabase,

    exec: (sql) => {
      db.run(sql);
      saveDatabase();
    },

    get: (sql, params = []) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return null;
    },

    all: (sql, params = []) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },

    run: (sql, params = []) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      const lastID = stmt.getLastInsertedRowId();
      stmt.free();
      saveDatabase();
      return { lastID };
    },

    close: () => {
      saveDatabase();
      db.close();
    },
  };

  console.log("Database initialized successfully");
  return dbWrapper;
};

module.exports = {
  initializeDatabase,
};
