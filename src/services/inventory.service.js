const { initializeDatabase } = require("../config/database");

let db;
const initializeDb = async () => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

const addStock = async (
  productId,
  { quantity, batchNumber, expiryDate, location },
) => {
  const database = await initializeDb();
  const result = await database.run(
    `INSERT INTO inventory 
     (product_id, quantity, batch_number, expiry_date, location)
     VALUES (?, ?, ?, ?, ?)`,
    [productId, quantity, batchNumber, expiryDate, location],
  );

  // Update product stock quantity
  await database.run(
    `UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [quantity, productId],
  );

  return await database.get("SELECT * FROM inventory WHERE id = ?", [result.lastID]);
};

const removeStock = async (productId, { quantity, reason }) => {
  const database = await initializeDb();

  try {
    await database.run("BEGIN TRANSACTION");

    // Get available inventory
    const inventoryItems = await database.all(
      `SELECT * FROM inventory 
       WHERE product_id = ? AND quantity > 0
       ORDER BY expiry_date ASC`,
      [productId],
    );

    let remainingQty = quantity;
    const removedItems = [];

    for (const item of inventoryItems) {
      if (remainingQty <= 0) break;

      const takeQty = Math.min(item.quantity, remainingQty);

      await database.run(
        `UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [takeQty, item.id],
      );

      remainingQty -= takeQty;
      removedItems.push({ ...item, removed: takeQty });
    }

    if (remainingQty > 0) {
      throw new Error("Insufficient stock available");
    }

    // Update product stock
    await database.run(
      `UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [quantity, productId],
    );

    await database.run("COMMIT");

    return {
      productId,
      quantityRemoved: quantity,
      reason,
      items: removedItems,
    };
  } catch (error) {
    await database.run("ROLLBACK");
    throw error;
  }
};

const getInventoryByProduct = async (productId) => {
  const database = await initializeDb();
  return await database.all(
    `SELECT * FROM inventory WHERE product_id = ? ORDER BY created_at DESC`,
    [productId],
  );
};

const getAllInventory = async (options = {}) => {
  const database = await initializeDb();
  const { page = 1, limit = 20, lowStock, expiringSoon, storeId } = options;
  const offset = (page - 1) * limit;

  let whereClauses = ["(p.store_id IS NULL OR p.store_id = ?)"];
  let params = [storeId || null];

  if (expiringSoon) {
    const days = expiringSoon.days || 30;
    whereClauses.push(`i.expiry_date IS NOT NULL AND i.expiry_date <= date('now', '+${days} days')`);
  }

  const whereClause = whereClauses.join(" AND ");

  const countQuery = `
    SELECT COUNT(*) as count
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE ${whereClause}
  `;
  const countResult = await database.get(countQuery, params);
  const total = parseInt(countResult.count);

  const query = `
    SELECT i.*, p.name as product_name, p.barcode, p.unit_price, p.low_stock_threshold
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE ${whereClause}
    ORDER BY i.expiry_date ASC LIMIT ? OFFSET ?
  `;
  
  const rows = await database.all(query, [...params, parseInt(limit), offset]);

  return {
    inventory: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const adjustStock = async (productId, adjustment, reason) => {
  const database = await initializeDb();
  const result = await database.run(
    `INSERT INTO inventory 
     (product_id, quantity, batch_number, location)
     VALUES (?, ?, ?, ?)`,
    [
      productId,
      adjustment.adjustment,
      adjustment.batchNumber || "ADJUSTMENT",
      adjustment.location,
    ],
  );

  await database.run(
    `UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [adjustment.adjustment, productId],
  );

  return await database.get("SELECT * FROM inventory WHERE id = ?", [result.lastID]);
};

const getStockMovements = async (productId, options = {}) => {
  const database = await initializeDb();
  const { startDate, endDate } = options;

  let whereClauses = ["i.product_id = ?"];
  let params = [productId];

  if (startDate) {
    whereClauses.push("i.created_at >= ?");
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push("i.created_at <= ?");
    params.push(endDate);
  }

  const whereClause = whereClauses.join(" AND ");

  const query = `
    SELECT i.*, p.name as product_name
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE ${whereClause}
    ORDER BY i.created_at DESC
  `;

  return await database.all(query, params);
};

const getInventoryValuation = async (storeId) => {
  const database = await initializeDb();
  const items = await database.all(
    `SELECT 
       p.id,
       p.name,
       p.barcode,
       p.unit_price,
       p.stock_quantity,
       p.unit_price * p.stock_quantity as total_value
     FROM products p
     WHERE p.store_id IS NULL OR p.store_id = ?`,
    [storeId],
  );

  const totalValue = items.reduce(
    (sum, item) => sum + parseFloat(item.total_value || 0),
    0,
  );

  return {
    items,
    totalValue,
    totalProducts: items.length,
    totalUnits: items.reduce(
      (sum, item) => sum + parseInt(item.stock_quantity || 0),
      0,
    ),
  };
};

module.exports = {
  addStock,
  removeStock,
  getInventoryByProduct,
  getAllInventory,
  adjustStock,
  getStockMovements,
  getInventoryValuation,
};
