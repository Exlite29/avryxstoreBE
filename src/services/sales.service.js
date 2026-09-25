const { initializeDatabase, sqlDate } = require("../config/database");
const { formatCurrency } = require("../utils/helpers");

let db;
const initializeDb = async () => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

/**
 * Create a new sale transaction
 */
const createSale = async (args) => {
  const {
    items,
    paymentMethod,
    amountPaid,
    discount = 0,
    customerId,
    notes,
    cashierId,
    storeId,
  } = args;

  const payment_method = args.payment_method || paymentMethod || "cash";
  const amount_paid = args.amount_paid ?? amountPaid;
  const customer_id = args.customer_id ?? customerId;

  const database = await initializeDb();

  try {
    await database.run("BEGIN TRANSACTION");

    // Generate a unique transaction number (monotonic via MAX(id), safe under concurrency)
    await database.run("SELECT pg_advisory_xact_lock(hashtext('sales_txn_number'))");
    const txnResult = await database.get(
      "SELECT to_char(CURRENT_DATE, 'YYYYMMDD') AS txn_day, COALESCE(MAX(id), 0) + 1 AS next_num FROM sales",
    );
    const transactionNumber = `TXN-${txnResult.txn_day}-${String(txnResult.next_num).padStart(5, "0")}`;

    // Process items and calculate totals
    const saleItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await database.get(
        "SELECT * FROM products WHERE id = ?",
        [item.product_id],
      );

      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }

      if (product.stock_quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`,
        );
      }

      const unitPrice = item.unitPrice ?? item.unit_price ?? product.unit_price;
      const itemTotal = unitPrice * item.quantity;

      saleItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
      });

      subtotal += itemTotal;

      // Update stock
      await database.run(
        "UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [item.quantity, product.id],
      );
    }

    // Calculate taxes and totals
    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * 0.12; // 12% VAT
    const totalAmount = taxableAmount + taxAmount;

    // Calculate change
    const paymentReceived = amount_paid || totalAmount;
    const changeGiven = paymentReceived - totalAmount;

    if (changeGiven < 0) {
      throw new Error(
        `Insufficient payment. Total: ${formatCurrency(totalAmount)}, Paid: ${formatCurrency(paymentReceived)}`,
      );
    }

    // Create sale record
    const saleResult = await database.run(
      `INSERT INTO sales 
       (transaction_number, cashier_id, subtotal, discount, tax, total_amount, 
        payment_method, payment_received, change_given, customer_id, notes, store_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionNumber,
        cashierId,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        payment_method,
        paymentReceived,
        changeGiven,
        customer_id,
        notes,
        storeId,
      ],
    );

    const saleId = saleResult.lastID;

    // Create sale items records
    for (const item of saleItems) {
      await database.run(
        `INSERT INTO sales_items 
         (sale_id, product_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [
          saleId,
          item.productId,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
        ],
      );
    }

    await database.run("COMMIT");

    const newSale = await database.get("SELECT * FROM sales WHERE id = ?", [
      saleId,
    ]);

    return {
      ...newSale,
      items: saleItems,
      formattedTotal: formatCurrency(totalAmount),
      formattedPaymentReceived: formatCurrency(paymentReceived),
      formattedChangeGiven: formatCurrency(changeGiven),
      paymentReceived,
      changeGiven,
    };
  } catch (error) {
    await database.run("ROLLBACK");
    throw error;
  }
};

/**
 * Get sales history with filters and pagination
 */
const getSales = async (args) => {
  const {
    page = 1,
    limit = 20,
    status,
    storeId,
  } = args;
  const startDate = args.startDate ?? args.start_date;
  const endDate = args.endDate ?? args.end_date;
  const offset = (page - 1) * limit;
  const database = await initializeDb();

  let whereClauses = ["(s.store_id IS NULL OR s.store_id = ?)"];
  let params = [storeId];

  if (startDate) {
    whereClauses.push("s.created_at >= ?");
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push("s.created_at <= ?");
    params.push(endDate);
  }
  if (status) {
    whereClauses.push("s.status = ?");
    params.push(status);
  }

  const whereClause = whereClauses.join(" AND ");

  // Count total for pagination
  const countQuery = `SELECT COUNT(*) as count FROM sales s WHERE ${whereClause}`;
  const countResult = await database.get(countQuery, params);
  const total = parseInt(countResult.count);

  // Get paginated data
  const query = `
    SELECT s.*, u.full_name as cashier_name
    FROM sales s
    LEFT JOIN users u ON s.cashier_id = u.id
    WHERE ${whereClause}
    ORDER BY s.created_at DESC 
    LIMIT ? OFFSET ?
  `;

  const sales = await database.all(query, [...params, parseInt(limit), offset]);

  return {
    sales,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get detailed sale by ID
 */
const getSaleById = async (id, storeId) => {
  const database = await initializeDb();
  const sale = await database.get(
    `SELECT s.*, u.full_name as cashier_name 
     FROM sales s 
     LEFT JOIN users u ON s.cashier_id = u.id 
     WHERE s.id = ? AND (s.store_id IS NULL OR s.store_id = ?)`,
    [id, storeId],
  );

  if (!sale) {
    return null;
  }

  const items = await database.all(
    `SELECT si.*, p.name, p.barcode 
     FROM sales_items si 
     JOIN products p ON si.product_id = p.id 
     WHERE si.sale_id = ?`,
    [id],
  );

  return {
    ...sale,
    items,
  };
};

/**
 * Cancel a sale and restore stock
 */
const cancelSale = async (id, reason, storeId) => {
  const database = await initializeDb();

  try {
    await database.run("BEGIN TRANSACTION");

    // Get sale
    const sale = await database.get(
      "SELECT * FROM sales WHERE id = ? AND (store_id IS NULL OR store_id = ?)",
      [id, storeId],
    );

    if (!sale) {
      throw new Error("Sale not found");
    }

    if (sale.status === "cancelled") {
      throw new Error("Sale is already cancelled");
    }

    // Restore stock for all items
    const items = await database.all(
      "SELECT * FROM sales_items WHERE sale_id = ?",
      [id],
    );

    for (const item of items) {
      await database.run(
        "UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [item.quantity, item.product_id],
      );
    }

    // Update sale status
    await database.run(
      `UPDATE sales 
       SET status = 'cancelled', 
           notes = notes || ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [`\nCancelled: ${reason || "No reason provided"}`, id],
    );

    await database.run("COMMIT");
    return await database.get("SELECT * FROM sales WHERE id = ?", [id]);
  } catch (error) {
    await database.run("ROLLBACK");
    throw error;
  }
};

/**
 * Get daily sales summary (revenue and count)
 */
const getDailySummary = async (storeId) => {
  const database = await initializeDb();
  const today = new Date().toISOString().split("T")[0];

  const result = await database.get(
    `SELECT 
       COUNT(*) as sale_count,
       SUM(total_amount) as total_revenue
     FROM sales
     WHERE (store_id IS NULL OR store_id = ?)
     AND ${sqlDate.dateOf("created_at")} = ?
     AND status = 'completed'`,
    [storeId, today],
  );

  return {
    total_revenue: parseFloat(result?.total_revenue || 0),
    sale_count: parseInt(result?.sale_count || 0),
  };
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  cancelSale,
  getDailySummary,
};
