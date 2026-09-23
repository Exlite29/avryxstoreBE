const { pool } = require("../config/database");

class Sale {
  constructor(data) {
    this.id = data.id;
    this.transaction_number = data.transaction_number;
    this.customer_id = data.customer_id;
    this.cashier_id = data.cashier_id;
    this.subtotal = data.subtotal;
    this.discount = data.discount;
    this.tax = data.tax;
    this.total_amount = data.total_amount;
    this.payment_method = data.payment_method;
    this.payment_received = data.payment_received;
    this.change_given = data.change_given;
    this.status = data.status;
    this.notes = data.notes;
    this.store_id = data.store_id;
    this.created_at = data.created_at;
  }

  // Create a new sale
  static async create(saleData) {
    const {
      transaction_number,
      customer_id,
      cashier_id,
      subtotal,
      discount,
      tax,
      total_amount,
      payment_method,
      payment_received,
      change_given,
      status = "completed",
      notes,
      store_id,
    } = saleData;

    const query = `
      INSERT INTO sales (
        transaction_number, customer_id, cashier_id, subtotal, discount, tax,
        total_amount, payment_method, payment_received, change_given, status, notes, store_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      transaction_number,
      customer_id,
      cashier_id,
      subtotal,
      discount,
      tax,
      total_amount,
      payment_method,
      payment_received,
      change_given,
      status,
      notes,
      store_id,
    ];

    const result = await pool.query(query, values);
    return new Sale(result.rows[0]);
  }

  // Find sale by ID
  static async findById(id) {
    const query = "SELECT * FROM sales WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0 ? new Sale(result.rows[0]) : null;
  }

  // Find sale by transaction number
  static async findByTransactionNumber(transactionNumber) {
    const query = "SELECT * FROM sales WHERE transaction_number = $1";
    const result = await pool.query(query, [transactionNumber]);
    return result.rows.length > 0 ? new Sale(result.rows[0]) : null;
  }

  // Find all sales with filters
  static async findAll(filters = {}, options = {}) {
    let query = "SELECT * FROM sales";
    const values = [];
    let whereClause = "";
    const conditions = [];

    // Apply filters
    if (filters.cashier_id) {
      conditions.push(`cashier_id = $${values.length + 1}`);
      values.push(filters.cashier_id);
    }

    if (filters.store_id) {
      conditions.push(`store_id = $${values.length + 1}`);
      values.push(filters.store_id);
    }

    if (filters.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(filters.status);
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

    // Apply ordering and limits
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || "ASC"}`;
    } else {
      query += " ORDER BY created_at DESC";
    }

    if (options.limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }

    const result = await pool.query(query, values);
    return result.rows.map(row => new Sale(row));
  }

  // Update sale
  static async update(id, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
    const values = Object.values(updateData);
    values.push(id);

    const query = `
      UPDATE sales
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0 ? new Sale(result.rows[0]) : null;
  }

  // Delete sale
  static async delete(id) {
    const query = "DELETE FROM sales WHERE id = $1 RETURNING *";
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  // Get sales summary for a period
  static async getSalesSummary(storeId, startDate, endDate) {
    const query = `
      SELECT
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_revenue,
        SUM(discount) as total_discounts,
        AVG(total_amount) as average_transaction_value
      FROM sales
      WHERE store_id = $1
      AND created_at >= $2
      AND created_at <= $3
      AND status = 'completed'
    `;
    const values = [storeId, startDate, endDate];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get sales by payment method
  static async getSalesByPaymentMethod(storeId, startDate, endDate) {
    const query = `
      SELECT
        payment_method,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_amount
      FROM sales
      WHERE store_id = $1
      AND created_at >= $2
      AND created_at <= $3
      AND status = 'completed'
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `;
    const values = [storeId, startDate, endDate];
    const result = await pool.query(query, values);
    return result.rows;
  }
}

// Sales Items model
class SalesItem {
  constructor(data) {
    this.id = data.id;
    this.sale_id = data.sale_id;
    this.product_id = data.product_id;
    this.quantity = data.quantity;
    this.unit_price = data.unit_price;
    this.total_price = data.total_price;
    this.discount = data.discount;
    this.created_at = data.created_at;
  }

  // Create a new sales item
  static async create(salesItemData) {
    const {
      sale_id,
      product_id,
      quantity,
      unit_price,
      total_price,
      discount,
    } = salesItemData;

    const query = `
      INSERT INTO sales_items (
        sale_id, product_id, quantity, unit_price, total_price, discount
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      sale_id,
      product_id,
      quantity,
      unit_price,
      total_price,
      discount,
    ];

    const result = await pool.query(query, values);
    return new SalesItem(result.rows[0]);
  }

  // Find sales items by sale ID
  static async findBySaleId(saleId) {
    const query = "SELECT * FROM sales_items WHERE sale_id = $1";
    const result = await pool.query(query, [saleId]);
    return result.rows.map(row => new SalesItem(row));
  }

  // Find sales items by product ID
  static async findByProductId(productId, options = {}) {
    let query = "SELECT * FROM sales_items WHERE product_id = $1";
    const values = [productId];

    if (options.limit) {
      query += ` LIMIT $${values.length + 1}`;
      values.push(options.limit);
    }

    const result = await pool.query(query, values);
    return result.rows.map(row => new SalesItem(row));
  }
}

module.exports = {
  Sale,
  SalesItem,
};