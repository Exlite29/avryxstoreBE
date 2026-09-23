const { pool } = require("../config/database");

class Barcode {
  constructor(data) {
    this.id = data.id;
    this.barcode = data.barcode;
    this.product_id = data.product_id;
    this.barcode_type = data.barcode_type;
    this.is_primary = data.is_primary;
    this.created_at = data.created_at;
  }

  // Create a new barcode
  static async create(barcodeData) {
    const {
      barcode,
      product_id,
      barcode_type,
      is_primary = false,
    } = barcodeData;

    const query = `
      INSERT INTO barcodes (
        barcode, product_id, barcode_type, is_primary
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [barcode, product_id, barcode_type, is_primary];

    const result = await pool.query(query, values);
    return new Barcode(result.rows[0]);
  }

  // Find barcode by ID
  static async findById(id) {
    const query = "SELECT * FROM barcodes WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? new Barcode(result.rows[0]) : null;
  }

  // Find barcode by barcode value
  static async findByBarcode(barcode) {
    const query = "SELECT * FROM barcodes WHERE barcode = $1";
    const result = await pool.query(query, [barcode]);
    return result.rows.length > 0 ? new Barcode(result.rows[0]) : null;
  }

  // Find barcodes by product ID
  static async findByProductId(productId) {
    const query = "SELECT * FROM barcodes WHERE product_id = $1";
    const result = await pool.query(query, [productId]);
    return result.rows.map(row => new Barcode(row));
  }

  // Find primary barcode for a product
  static async findPrimaryByProductId(productId) {
    const query = "SELECT * FROM barcodes WHERE product_id = $1 AND is_primary = true";
    const result = await pool.query(query, [productId]);
    return result.rows.length > 0 ? new Barcode(result.rows[0]) : null;
  }

  // Find all barcodes with filters
  static async findAll(filters = {}, options = {}) {
    let query = "SELECT * FROM barcodes";
    const values = [];
    let whereClause = "";
    const conditions = [];

    // Apply filters
    if (filters.product_id) {
      conditions.push(`product_id = $${values.length + 1}`);
      values.push(filters.product_id);
    }

    if (filters.barcode_type) {
      conditions.push(`barcode_type = $${values.length + 1}`);
      values.push(filters.barcode_type);
    }

    if (filters.is_primary !== undefined) {
      conditions.push(`is_primary = $${values.length + 1}`);
      values.push(filters.is_primary);
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
    return result.rows.map(row => new Barcode(row));
  }

  // Update barcode
  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
    const values = Object.values(updateData);
    values.push(id);

    const query = `
      UPDATE barcodes
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new Barcode(result.rows[0]) : null;
  }

  // Delete barcode
  static async delete(id) {
    const query = "DELETE FROM barcodes WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  // Set barcode as primary for product
  static async setPrimary(productId, barcodeId) {
    // First set all barcodes for this product as non-primary
    await pool.query(
      "UPDATE barcodes SET is_primary = false WHERE product_id = $1",
      [productId]
    );

    // Then set the specified barcode as primary
    const query = `
      UPDATE barcodes
      SET is_primary = true
      WHERE id = $1 AND product_id = $2
      RETURNING *
    `;
    const values = [barcodeId, productId];
    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new Barcode(result.rows[0]) : null;
  }
}

module.exports = Barcode;