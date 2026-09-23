const { pool } = require("../config/database");

class Store {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.address = data.address;
    this.phone = data.phone;
    this.owner_id = data.owner_id;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
  }

  // Create a new store
  static async create(storeData) {
    const {
      name,
      address,
      phone,
      owner_id,
      is_active = true,
    } = storeData;

    const query = `
      INSERT INTO stores (
        name, address, phone, owner_id, is_active
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [name, address, phone, owner_id, is_active];

    const result = await pool.query(query, values);
    return new Store(result.rows[0]);
  }

  // Find store by ID
  static async findById(id) {
    const query = "SELECT * FROM stores WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? new Store(result.rows[0]) : null;
  }

  // Find store by owner ID
  static async findByOwnerId(ownerId) {
    const query = "SELECT * FROM stores WHERE owner_id = $1";
    const result = await pool.query(query, [ownerId]);
    return result.rows.map(row => new Store(row));
  }

  // Find all stores with filters
  static async findAll(filters = {}, options = {}) {
    let query = "SELECT * FROM stores";
    const values = [];
    let whereClause = "";
    const conditions = [];

    // Apply filters
    if (filters.owner_id) {
      conditions.push(`owner_id = $${values.length + 1}`);
      values.push(filters.owner_id);
    }

    if (filters.is_active !== undefined) {
      conditions.push(`is_active = $${values.length + 1}`);
      values.push(filters.is_active);
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
    return result.rows.map(row => new Store(row));
  }

  // Update store
  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
    const values = Object.values(updateData);
    values.push(id);

    const query = `
      UPDATE stores
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new Store(result.rows[0]) : null;
  }

  // Delete store (soft delete by setting inactive)
  static async delete(id) {
    const query = `
      UPDATE stores
      SET is_active = false
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? new Store(result.rows[0]) : null;
  }

  // Get store statistics
  static async getStatistics(storeId) {
    const queries = [
      // Total products
      `SELECT COUNT(*) as total_products FROM products WHERE store_id = $1`,
      // Total inventory items
      `SELECT COUNT(*) as total_inventory_items FROM inventory WHERE store_id = $1`,
      // Total sales
      `SELECT COUNT(*) as total_sales, SUM(total_amount) as total_revenue
       FROM sales WHERE store_id = $1 AND status = 'completed'`,
      // Low stock items
      `SELECT COUNT(*) as low_stock_items
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       WHERE i.store_id = $1 AND i.quantity <= p.low_stock_threshold`,
    ];

    const results = await Promise.all(
      queries.map(query => pool.query(query, [storeId]))
    );

    return {
      total_products: parseInt(results[0].rows[0].total_products),
      total_inventory_items: parseInt(results[1].rows[0].total_inventory_items),
      total_sales: parseInt(results[2].rows[0].total_sales),
      total_revenue: parseFloat(results[2].rows[0].total_revenue || 0),
      low_stock_items: parseInt(results[3].rows[0].low_stock_items),
    };
  }
}

module.exports = Store;