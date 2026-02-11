const { pool } = require("../config/database");

class Transaction {
  constructor(data) {
    this.id = data.id;
    this.transaction_type = data.transaction_type;
    this.entity_type = data.entity_type;
    this.entity_id = data.entity_id;
    this.user_id = data.user_id;
    this.old_values = data.old_values;
    this.new_values = data.new_values;
    this.ip_address = data.ip_address;
    this.created_at = data.created_at;
  }

  // Create a new transaction log
  static async create(transactionData) {
    const {
      transaction_type,
      entity_type,
      entity_id,
      user_id,
      old_values,
      new_values,
      ip_address,
    } = transactionData;

    const query = `
      INSERT INTO transactions (
        transaction_type, entity_type, entity_id, user_id, old_values, new_values, ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      transaction_type,
      entity_type,
      entity_id,
      user_id,
      old_values,
      new_values,
      ip_address,
    ];

    const result = await pool.query(query, values);
    return new Transaction(result.rows[0]);
  }

  // Find transaction by ID
  static async findById(id) {
    const query = "SELECT * FROM transactions WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? new Transaction(result.rows[0]) : null;
  }

  // Find transactions by user ID
  static async findByUserId(userId, options = {}) {
    let query = "SELECT * FROM transactions WHERE user_id = $1";
    const values = [userId];

    // Apply date filters
    if (options.date_from) {
      query += ` AND created_at >= $${values.length + 1}`;
      values.push(options.date_from);
    }

    if (options.date_to) {
      query += ` AND created_at <= $${values.length + 1}`;
      values.push(options.date_to);
    }

    // Apply ordering and limits
    query += " ORDER BY created_at DESC";

    if (options.limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }

    const result = await pool.query(query, values);
    return result.rows.map(row => new Transaction(row));
  }

  // Find transactions by entity
  static async findByEntity(entityType, entityId, options = {}) {
    let query = "SELECT * FROM transactions WHERE entity_type = $1 AND entity_id = $2";
    const values = [entityType, entityId];

    // Apply date filters
    if (options.date_from) {
      query += ` AND created_at >= $${values.length + 1}`;
      values.push(options.date_from);
    }

    if (options.date_to) {
      query += ` AND created_at <= $${values.length + 1}`;
      values.push(options.date_to);
    }

    // Apply ordering and limits
    query += " ORDER BY created_at DESC";

    if (options.limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }

    const result = await pool.query(query, values);
    return result.rows.map(row => new Transaction(row));
  }

  // Find all transactions with filters
  static async findAll(filters = {}, options = {}) {
    let query = "SELECT * FROM transactions";
    const values = [];
    let whereClause = "";
    const conditions = [];

    // Apply filters
    if (filters.user_id) {
      conditions.push(`user_id = $${values.length + 1}`);
      values.push(filters.user_id);
    }

    if (filters.entity_type) {
      conditions.push(`entity_type = $${values.length + 1}`);
      values.push(filters.entity_type);
    }

    if (filters.transaction_type) {
      conditions.push(`transaction_type = $${values.length + 1}`);
      values.push(filters.transaction_type);
    }

    if (filters.date_from) {
      conditions.push(`created_at >= $${values.length + 1}`);
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      conditions.push(`created_at <= $${values.length + 1}`);
      values.push(filters.date_to);
    }

    if (conditions.length > 0) {
      whereClause = " WHERE " + conditions.join(" AND ");
    }

    query += whereClause;

    // Apply ordering
    query += " ORDER BY created_at DESC";

    if (options.limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }

    const result = await pool.query(query, values);
    return result.rows.map(row => new Transaction(row));
  }

  // Get audit trail for a specific entity
  static async getAuditTrail(entityType, entityId, options = {}) {
    const query = `
      SELECT t.*, u.full_name as user_name
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.entity_type = $1 AND t.entity_id = $2
      ORDER BY t.created_at DESC
      LIMIT $3
    `;
    const values = [entityType, entityId, options.limit || 50];
    const result = await pool.query(query, values);
    return result.rows.map(row => ({
      ...new Transaction(row),
      user_name: row.user_name,
    }));
  }
}

module.exports = Transaction;