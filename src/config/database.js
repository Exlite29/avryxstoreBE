const { Pool, types } = require("pg");

const IS_POSTGRES = true;

types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10)));

const POSTGRES_DDL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'cashier',
    store_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    batch_number VARCHAR(100),
    expiry_date DATE,
    location VARCHAR(255),
    store_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS barcodes (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE NOT NULL,
    product_id INTEGER,
    barcode_type VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_scans (
    id SERIAL PRIMARY KEY,
    scan_type VARCHAR(20),
    input_data TEXT,
    product_id INTEGER,
    confidence_score DECIMAL(3, 2),
    scanned_by INTEGER,
    store_id INTEGER,
    device_id VARCHAR(100),
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER,
    user_id INTEGER,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    priority VARCHAR(20) DEFAULT 'normal',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    owner_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
  CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
`;

const toPgSql = (sql) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

class PostgresDatabase {
  constructor(pool) {
    this._pool = pool;
    this._txClient = null;
  }

  _target() {
    return this._txClient || this._pool;
  }

  async all(sql, params = []) {
    const result = await this._target().query(toPgSql(sql), params);
    return result.rows;
  }

  async get(sql, params = []) {
    const result = await this._target().query(toPgSql(sql), params);
    return result.rows[0];
  }

  async run(sql, params = []) {
    const command = (sql || "").trim().toUpperCase();

    if (command.startsWith("BEGIN")) {
      this._txClient = await this._pool.connect();
      await this._txClient.query("BEGIN");
      return { lastID: undefined, changes: 0 };
    }

    if (command.startsWith("COMMIT")) {
      const client = this._txClient || this._pool;
      await client.query("COMMIT");
      if (this._txClient) {
        this._txClient.release();
        this._txClient = null;
      }
      return { lastID: undefined, changes: 0 };
    }

    if (command.startsWith("ROLLBACK")) {
      const client = this._txClient || this._pool;
      await client.query("ROLLBACK");
      if (this._txClient) {
        this._txClient.release();
        this._txClient = null;
      }
      return { lastID: undefined, changes: 0 };
    }

    let query = toPgSql(sql);
    const trimmed = query.trim();
    if (/^insert/i.test(trimmed) && !/returning/i.test(trimmed)) {
      query = trimmed.replace(/;\s*$/, "") + " RETURNING id";
    }

    const result = await this._target().query(query, params);
    const first = result.rows && result.rows[0];
    return {
      lastID: first ? first.id : undefined,
      changes: result.rowCount,
      row: first || null,
    };
  }

  async exec(sql) {
    await this._pool.query(sql);
  }

  async close() {
    if (this._txClient) {
      try {
        this._txClient.release();
      } catch (e) {}
      this._txClient = null;
    }
    await this._pool.end();
  }
}

const initializeDatabase = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required. Configure it in your .env or deployment environment."
    );
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.PGSSLMODE === "disable"
        ? false
        : { rejectUnauthorized: false },
  });
  await pool.query(POSTGRES_DDL);
  console.log("Database initialized successfully (PostgreSQL)");
  return new PostgresDatabase(pool);
};

const sqlBool = (value) => !!value;

const sqlDate = {
  strftime: (format, expr) => {
    const fmtMap = {
      "%Y-%m-%d %H:00": "YYYY-MM-DD HH24:00",
      "%Y-%m-%d": "YYYY-MM-DD",
      "%Y-W%W": 'IYYY"-W"IW',
      "%Y-%m": "YYYY-MM",
      "%H": "HH24",
    };
    return `to_char(${expr}, '${fmtMap[format] || format}')`;
  },
  dateOf: (expr) => `${expr}::date`,
  today: () => "CURRENT_DATE",
  addDays: (days) => `(CURRENT_DATE + INTERVAL '${days} days')`,
};

module.exports = {
  initializeDatabase,
  IS_POSTGRES,
  sqlBool,
  sqlDate,
  toPgSql,
  PostgresDatabase,
};