const { initializeDatabase } = require("../config/database");

let db;
const initializeDb = async () => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

// Sales Report
const getSalesReport = async (options = {}) => {
  const database = await initializeDb();
  const { startDate, endDate, groupBy = "day", storeId } = options;

  let strftimeFormat = "%Y-%m-%d";
  if (groupBy === "hour") {
    strftimeFormat = "%Y-%m-%d %H:00";
  } else if (groupBy === "week") {
    strftimeFormat = "%Y-W%W";
  } else if (groupBy === "month") {
    strftimeFormat = "%Y-%m";
  }

  const params = [storeId];
  let dateCondition = "";

  if (startDate) {
    dateCondition += ` AND s.created_at >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    dateCondition += ` AND s.created_at <= ?`;
    params.push(endDate);
  }

  const results = await database.all(
    `SELECT 
       strftime('${strftimeFormat}', s.created_at) as period,
       COUNT(*) as transaction_count,
       SUM(s.total_amount) as total_sales,
       SUM(s.subtotal) as subtotal,
       SUM(s.discount) as total_discount,
       SUM(s.tax) as total_tax,
       AVG(s.total_amount) as avg_transaction_value
     FROM sales s
     WHERE (s.store_id IS NULL OR s.store_id = ?)
     AND s.status = 'completed'
     ${dateCondition}
     GROUP BY period
     ORDER BY period DESC`,
    params,
  );

  // Get summary totals
  const summary = await database.get(
    `SELECT 
       COUNT(*) as total_transactions,
       SUM(total_amount) as total_sales,
       SUM(subtotal) as subtotal,
       SUM(discount) as total_discount,
       SUM(tax) as total_tax,
       MIN(created_at) as start_date,
       MAX(created_at) as end_date
     FROM sales s
     WHERE (s.store_id IS NULL OR s.store_id = ?)
     AND s.status = 'completed'
     ${dateCondition}`,
    params,
  );

  return {
    period: results.map((row) => ({
      period: row.period,
      transactionCount: parseInt(row.transaction_count),
      totalSales: parseFloat(row.total_sales || 0),
      subtotal: parseFloat(row.subtotal || 0),
      discount: parseFloat(row.total_discount || 0),
      tax: parseFloat(row.total_tax || 0),
      avgTransactionValue: parseFloat(row.avg_transaction_value || 0),
    })),
    summary: {
      totalTransactions: parseInt(summary.total_transactions || 0),
      totalSales: parseFloat(summary.total_sales || 0),
      totalDiscount: parseFloat(summary.total_discount || 0),
      totalTax: parseFloat(summary.total_tax || 0),
      period: {
        start: summary.start_date,
        end: summary.end_date,
      },
    },
  };
};

// Top Products Report
const getTopProductsReport = async (options = {}) => {
  const database = await initializeDb();
  const { startDate, endDate, limit = 10, storeId } = options;

  const params = [storeId];
  let dateCondition = "";

  if (startDate) {
    dateCondition += ` AND s.created_at >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    dateCondition += ` AND s.created_at <= ?`;
    params.push(endDate);
  }

  const rows = await database.all(
    `SELECT 
       p.id,
       p.name,
       p.barcode,
       p.category,
       SUM(si.quantity) as total_quantity_sold,
       SUM(si.total_price) as total_revenue,
       COUNT(DISTINCT s.id) as transaction_count
     FROM sales_items si
     JOIN sales s ON si.sale_id = s.id
     JOIN products p ON si.product_id = p.id
     WHERE (p.store_id IS NULL OR p.store_id = ?)
     AND s.status = 'completed'
     ${dateCondition}
     GROUP BY p.id, p.name, p.barcode, p.category
     ORDER BY total_revenue DESC
     LIMIT ?`,
    [...params, limit],
  );

  return rows.map((row, index) => ({
    rank: index + 1,
    productId: row.id,
    name: row.name,
    barcode: row.barcode,
    category: row.category,
    totalQuantitySold: parseInt(row.total_quantity_sold),
    totalRevenue: parseFloat(row.total_revenue),
    transactionCount: parseInt(row.transaction_count),
  }));
};

// Inventory Report
const getInventoryReport = async (options = {}) => {
  const database = await initializeDb();
  const { lowStock, expiringSoon, storeId } = options;

  let whereClauses = ["(p.store_id IS NULL OR p.store_id = ?)"];
  let params = [storeId];

  if (lowStock) {
    whereClauses.push(`p.stock_quantity <= p.low_stock_threshold`);
  }

  if (expiringSoon) {
    const days = expiringSoon.days || 30;
    whereClauses.push(`p.expiry_date IS NOT NULL AND p.expiry_date <= date('now', '+${days} days')`);
  }

  const whereClause = whereClauses.join(" AND ");

  const items = await database.all(
    `SELECT 
      p.id as productId,
      p.name,
      p.barcode,
      p.category,
      p.stock_quantity as stockQuantity,
      p.low_stock_threshold as lowStockThreshold,
      p.unit_price as unitPrice,
      p.expiry_date as expiryDate,
      p.stock_quantity * p.unit_price as stockValue
    FROM products p
    WHERE ${whereClause}
    ORDER BY p.stock_quantity ASC`,
    params,
  );

  // Get summary
  const summary = await database.get(
    `SELECT 
       COUNT(*) as total_products,
       SUM(stock_quantity) as total_units,
       SUM(stock_quantity * unit_price) as total_value,
       SUM(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count
     FROM products
     WHERE store_id IS NULL OR store_id = ?`,
    [storeId],
  );

  return {
    items: items.map((row) => ({
      ...row,
      stockQuantity: parseInt(row.stockQuantity),
      lowStockThreshold: parseInt(row.lowStockThreshold),
      unitPrice: parseFloat(row.unitPrice),
      stockValue: parseFloat(row.stockValue),
      isLowStock: parseInt(row.stockQuantity) <= parseInt(row.lowStockThreshold),
    })),
    summary: {
      totalProducts: parseInt(summary.total_products || 0),
      totalUnits: parseInt(summary.total_units || 0),
      totalValue: parseFloat(summary.total_value || 0),
      lowStockCount: parseInt(summary.low_stock_count || 0),
    },
  };
};

// Daily Sales Summary
const getDailySalesSummary = async (date = new Date(), storeId) => {
  const database = await initializeDb();
  const targetDate = new Date(date).toISOString().split("T")[0];

  const summary = await database.get(
    `SELECT 
       COUNT(*) as transaction_count,
       SUM(total_amount) as total_sales,
       SUM(discount) as total_discount,
       AVG(total_amount) as avg_transaction,
       MAX(total_amount) as highest_transaction,
       MIN(total_amount) as lowest_transaction
     FROM sales
     WHERE (store_id IS NULL OR store_id = ?)
     AND date(created_at) = ?
     AND status = 'completed'`,
    [storeId, targetDate],
  );

  // Get hourly breakdown
  const hourlyRows = await database.all(
    `SELECT 
       strftime('%H', created_at) as hour,
       COUNT(*) as transactions,
       SUM(total_amount) as sales
     FROM sales
     WHERE (store_id IS NULL OR store_id = ?)
     AND date(created_at) = ?
     AND status = 'completed'
     GROUP BY hour
     ORDER BY hour`,
    [storeId, targetDate],
  );

  return {
    date: targetDate,
    summary: {
      transactionCount: parseInt(summary.transaction_count) || 0,
      totalSales: parseFloat(summary.total_sales) || 0,
      totalDiscount: parseFloat(summary.total_discount) || 0,
      avgTransaction: parseFloat(summary.avg_transaction) || 0,
      highestTransaction: parseFloat(summary.highest_transaction) || 0,
      lowestTransaction: parseFloat(summary.lowest_transaction) || 0,
    },
    hourlyBreakdown: hourlyRows.map((row) => ({
      hour: parseInt(row.hour),
      transactions: parseInt(row.transactions),
      sales: parseFloat(row.sales),
    })),
  };
};

// Cash Flow Report
const getCashFlowReport = async (options = {}) => {
  const database = await initializeDb();
  const { startDate, endDate, storeId } = options;
  const params = [storeId];
  let dateCondition = "";

  if (startDate) {
    dateCondition += ` AND created_at >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    dateCondition += ` AND created_at <= ?`;
    params.push(endDate);
  }

  const rows = await database.all(
    `SELECT 
       payment_method,
       COUNT(*) as transaction_count,
       SUM(total_amount) as total_amount
     FROM sales
     WHERE (s.store_id IS NULL OR s.store_id = ?)
     AND status = 'completed'
     ${dateCondition}
     GROUP BY payment_method
     ORDER BY total_amount DESC`,
    params,
  );

  return rows.map((row) => ({
    paymentMethod: row.payment_method,
    transactionCount: parseInt(row.transaction_count),
    totalAmount: parseFloat(row.total_amount),
  }));
};

// Scanner Metrics
const getScannerMetrics = async (options = {}) => {
  const database = await initializeDb();
  const { startDate, endDate, storeId } = options;
  const params = [storeId];
  let dateCondition = "";

  if (startDate) {
    dateCondition += ` AND created_at >= ?`;
    params.push(startDate);
  }
  if (endDate) {
    dateCondition += ` AND created_at <= ?`;
    params.push(endDate);
  }

  const rows = await database.all(
    `SELECT 
       scan_type,
       COUNT(*) as scan_count,
       SUM(CASE WHEN product_id IS NOT NULL THEN 1 ELSE 0 END) as recognized_count,
       SUM(CASE WHEN product_id IS NULL THEN 1 ELSE 0 END) as unrecognized_count,
       AVG(confidence_score) as avg_confidence
     FROM product_scans
     WHERE (store_id IS NULL OR store_id = ?)
     ${dateCondition}
     GROUP BY scan_type`,
    params,
  );

  return {
    byType: rows.map((row) => ({
      scanType: row.scan_type,
      scanCount: parseInt(row.scan_count),
      recognizedCount: parseInt(row.recognized_count),
      unrecognizedCount: parseInt(row.unrecognized_count),
      recognitionRate:
        row.scan_count > 0
          ? (
              (parseInt(row.recognized_count) / parseInt(row.scan_count)) *
              100
            ).toFixed(2)
          : 0,
      avgConfidence: parseFloat(row.avg_confidence) || 0,
    })),
    totalScans: rows.reduce(
      (sum, row) => sum + parseInt(row.scan_count),
      0,
    ),
    totalRecognized: rows.reduce(
      (sum, row) => sum + parseInt(row.recognized_count),
      0,
    ),
  };
};

module.exports = {
  getSalesReport,
  getTopProductsReport,
  getInventoryReport,
  getDailySalesSummary,
  getCashFlowReport,
  getScannerMetrics,
};
