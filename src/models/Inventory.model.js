const { pool } = require("../config/database");

class Inventory {
  constructor(data) {
    this.id = data.id;
    this.product_id = data.product_id;
    this.quantity = data.quantity;
    this.batch_number = data.batch_number;
    this.expiry_date = data.expiry_date;
    this.location = data.location;
    this.store_id = data.store_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new inventory record
  static async create(inventoryData) {
    const {
      product_id,
      quantity,
      batch_number,
      expiry_date,
      location,
      store_id,
    } = inventoryData;

    const query = `
      INSERT INTO inventory (
        product_id, quantity, batch_number, expiry_date, location, store_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      product_id,
      quantity,
      batch_number,
      expiry_date,
      location,
      store_id,
    ];

    const result = await pool.query(query, values);
    return new Inventory(result.rows[0]);
  }

  // Find inventory by ID
  static async findById(id) {
    const query = "SELECT * FROM inventory WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? new Inventory(result.rows[0]) : null;
  }

  // Find inventory by product ID
  static async findByProductId(productId) {
    const query = "SELECT * FROM inventory WHERE product_id = $1";
    const result = await pool.query(query, [productId]);
    return result.rows.map(row => new Inventory(row));
  }

  // Find all inventory records with filters
  static async findAll(filters = {}, options = {}) {
    let query = "SELECT * FROM inventory";
    const values = [];
    let whereClause = "";
    const conditions = [];

    // Apply filters
    if (filters.product_id) {
      conditions.push(`product_id = $${values.length + 1}`);
      values.push(filters.product_id);
    }

    if (filters.store_id) {
      conditions.push(`store_id = $${values.length + 1}`);
      values.push(filters.store_id);
    }

    if (filters.batch_number) {
      conditions.push(`batch_number = $${values.length + 1}`);
      values.push(filters.batch_number);
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
    return result.rows.map(row => new Inventory(row));
  }

  // Update inventory record
  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
    const values = Object.values(updateData);
    values.push(id);

    const query = `
      UPDATE inventory
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new Inventory(result.rows[0]) : null;
  }

  // Delete inventory record
  static async delete(id) {
    const query = "DELETE FROM inventory WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  // Get low stock items
  static async getLowStockItems(storeId, threshold = 10) {
    const query = `
      SELECT i.*, p.name, p.barcode
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.store_id = $1 AND i.quantity <= $2
      ORDER BY i.quantity ASC
    `;
    const values = [storeId, threshold];
    const result = await pool.query(query, values);
    return result.rows.map(row => ({
      ...new Inventory(row),
      product_name: row.name,
      product_barcode: row.barcode,
    }));
  }

  // Get expiring items
  static async getExpiringItems(storeId, days = 30) {
    const query = `
      SELECT i.*, p.name, p.barcode
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.store_id = $1
      AND i.expiry_date IS NOT NULL
      AND i.expiry_date <= CURRENT_DATE + INTERVAL '${days} days'
      ORDER BY i.expiry_date ASC
    `;
    const values = [storeId];
    const result = await pool.query(query, values);
    return result.rows.map(row => ({
      ...new Inventory(row),
      product_name: row.name,
      product_barcode: row.barcode,
    }));
  }
}

module.exports = Inventory;