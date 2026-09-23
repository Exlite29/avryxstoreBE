const { pool } = require("../config/database");

class ProductScan {
  constructor(data) {
    this.id = data.id;
    this.scan_type = data.scan_type;
    this.input_data = data.input_data;
    this.product_id = data.product_id;
    this.confidence_score = data.confidence_score;
    this.scanned_by = data.scanned_by;
    this.store_id = data.store_id;
    this.device_id = data.device_id;
    this.location = data.location;
    this.created_at = data.created_at;
  }

  // Create a new scan record
  static async create(scanData) {
    const {
      scan_type,
      input_data,
      product_id,
      confidence_score,
      scanned_by,
      store_id,
      device_id,
      location,
    } = scanData;

    const query = `
      INSERT INTO product_scans (
        scan_type, input_data, product_id, confidence_score, scanned_by, store_id, device_id, location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      scan_type,
      input_data,
      product_id,
      confidence_score,
      scanned_by,
      store_id,
      device_id,
      location,
    ];

    const result = await pool.query(query, values);
    return new ProductScan(result.rows[0]);
  }

  // Find scan by ID
  static async findById(id) {
    const query = "SELECT * FROM product_scans WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? new ProductScan(result.rows[0]) : null;
  }

  // Find scans by product ID
  static async findByProductId(productId, options = {}) {
    let query = "SELECT * FROM product_scans WHERE product_id = $1";
    const values = [productId];

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
    return result.rows.map(row => new ProductScan(row));
  }

  // Find scans by user ID
  static async findByUserId(userId, options = {}) {
    let query = "SELECT * FROM product_scans WHERE scanned_by = $1";
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
    return result.rows.map(row => new ProductScan(row));
  }

  // Find all scans with filters
  static async findAll(filters = {}, options = {}) {
    let query = "SELECT ps.*, p.name as product_name, u.full_name as scanned_by_name FROM product_scans ps";
    query += " LEFT JOIN products p ON ps.product_id = p.id";
    query += " LEFT JOIN users u ON ps.scanned_by = u.id";

    const values = [];
    let whereClause = "";
    const conditions = [];

    // Apply filters
    if (filters.product_id) {
      conditions.push(`ps.product_id = $${values.length + 1}`);
      values.push(filters.product_id);
    }

    if (filters.scanned_by) {
      conditions.push(`ps.scanned_by = $${values.length + 1}`);
      values.push(filters.scanned_by);
    }

    if (filters.store_id) {
      conditions.push(`ps.store_id = $${values.length + 1}`);
      values.push(filters.store_id);
    }

    if (filters.scan_type) {
      conditions.push(`ps.scan_type = $${values.length + 1}`);
      values.push(filters.scan_type);
    }

    if (filters.date_from) {
      conditions.push(`ps.created_at >= $${values.length + 1}`);
      values.push(filters.date_from);
    }

    if (filters.date_to) {
      conditions.push(`ps.created_at <= $${values.length + 1}`);
      values.push(filters.date_to);
    }

    if (conditions.length > 0) {
      whereClause = " WHERE " + conditions.join(" AND ");
    }

    query += whereClause;

    // Apply ordering
    query += " ORDER BY ps.created_at DESC";

    if (options.limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }

    const result = await pool.query(query, values);
    return result.rows.map(row => ({
      ...new ProductScan(row),
      product_name: row.product_name,
      scanned_by_name: row.scanned_by_name,
    }));
  }

  // Get scan statistics
  static async getScanStatistics(storeId, startDate, endDate) {
    const query = `
      SELECT
        COUNT(*) as total_scans,
        COUNT(CASE WHEN product_id IS NOT NULL THEN 1 END) as successful_scans,
        COUNT(CASE WHEN product_id IS NULL THEN 1 END) as failed_scans,
        ROUND(
          CAST(COUNT(CASE WHEN product_id IS NOT NULL THEN 1 END) AS FLOAT) /
          CAST(COUNT(*) AS FLOAT) * 100, 2
        ) as success_rate,
        STRING_AGG(DISTINCT scan_type, ', ') as scan_types_used
      FROM product_scans
      WHERE store_id = $1
      AND created_at >= $2
      AND created_at <= $3
    `;
    const values = [storeId, startDate, endDate];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get most scanned products
  static async getMostScannedProducts(storeId, limit = 10) {
    const query = `
      SELECT
        p.id,
        p.name,
        p.barcode,
        COUNT(ps.id) as scan_count
      FROM product_scans ps
      JOIN products p ON ps.product_id = p.id
      WHERE ps.store_id = $1
      AND ps.product_id IS NOT NULL
      GROUP BY p.id, p.name, p.barcode
      ORDER BY scan_count DESC
      LIMIT $2
    `;
    const values = [storeId, limit];
    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = ProductScan;