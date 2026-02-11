const { pool } = require("../config/database");

class Product {
  constructor(data) {
    this.id = data.id;
    this.barcode = data.barcode;
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.unit_price = data.unit_price;
    this.wholesale_price = data.wholesale_price;
    this.stock_quantity = data.stock_quantity;
    this.low_stock_threshold = data.low_stock_threshold;
    this.image_urls = data.image_urls;
    this.barcode_image_url = data.barcode_image_url;
    this.supplier_id = data.supplier_id;
    this.expiry_date = data.expiry_date;
    this.store_id = data.store_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new product
  static async create(productData) {
    const {
      barcode,
      name,
      description,
      category,
      unit_price,
      wholesale_price,
      stock_quantity,
      low_stock_threshold,
      image_urls,
      barcode_image_url,
      supplier_id,
      expiry_date,
      store_id,
    } = productData;

    const query = `
      INSERT INTO products (
        barcode, name, description, category, unit_price, wholesale_price,
        stock_quantity, low_stock_threshold, image_urls, barcode_image_url,
        supplier_id, expiry_date, store_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      barcode,
      name,
      description,
      category,
      unit_price,
      wholesale_price,
      stock_quantity,
      low_stock_threshold,
      image_urls,
      barcode_image_url,
      supplier_id,
      expiry_date,
      store_id,
    ];

    const result = await pool.query(query, values);
    return new Product(result.rows[0]);
  }

  // Find product by ID
  static async findById(id) {
    const query = "SELECT * FROM products WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }

  // Find product by barcode
  static async findByBarcode(barcode) {
    const query = "SELECT * FROM products WHERE barcode = $1";
    const result = await pool.query(query, [barcode]);
    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }

  // Find all products with filters
  static async findAll(filters = {}, options = {}) {
    let query = "SELECT * FROM products";
    const values = [];
    let whereClause = "";
    const conditions = [];

    // Apply filters
    if (filters.category) {
      conditions.push(`category = $${values.length + 1}`);
      values.push(filters.category);
    }

    if (filters.store_id) {
      conditions.push(`store_id = $${values.length + 1}`);
      values.push(filters.store_id);
    }

    if (conditions.length > 0) {
      whereClause = " WHERE " + conditions.join(" AND ");
    }

    query += whereClause;

    // Apply ordering and limits
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || "ASC"}`;
    }

    if (options.limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }

    const result = await pool.query(query, values);
    return result.rows.map(row => new Product(row));
  }

  // Update product
  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
    const values = Object.values(updateData);
    values.push(id);

    const query = `
      UPDATE products
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }

  // Delete product
  static async delete(id) {
    const query = "DELETE FROM products WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  // Update stock quantity
  static async updateStock(productId, quantityChange) {
    const query = `
      UPDATE products
      SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const values = [quantityChange, productId];
    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new Product(result.rows[0]) : null;
  }
}

module.exports = Product;