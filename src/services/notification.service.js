const { initializeDatabase } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

let db;
const initializeDb = async () => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

// In-memory notification storage (fallback/cache)
const notificationsCache = new Map();

// Create notification
const create = async ({
  userId,
  type,
  title,
  message,
  data,
  priority = "normal",
}) => {
  const database = await initializeDb();
  
  const id = uuidv4();
  const notification = {
    id,
    userId,
    type,
    title,
    message,
    data,
    priority,
    read: false,
    createdAt: new Date().toISOString(),
  };

  // Cache notification
  if (!notificationsCache.has(userId)) {
    notificationsCache.set(userId, []);
  }
  notificationsCache.get(userId).unshift(notification);

  // Also save to database for persistence
  await database.run(
    `INSERT INTO notifications (user_id, type, title, message, data, priority)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, type, title, message, JSON.stringify(data || {}), priority],
  );

  return notification;
};

// Get notifications for user
const getByUser = async (userId, options = {}) => {
  const database = await initializeDb();
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const offset = (page - 1) * limit;

  let whereClauses = ["user_id = ?"];
  const params = [userId];

  if (unreadOnly) {
    whereClauses.push("read = 0");
  }

  const whereClause = whereClauses.join(" AND ");

  const query = `SELECT * FROM notifications WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const rows = await database.all(query, [...params, parseInt(limit), offset]);

  return {
    notifications: rows,
    unreadCount: await getUnreadCount(userId),
  };
};

// Mark notification as read
const markAsRead = async (notificationId, userId) => {
  const database = await initializeDb();
  await database.run(
    "UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?",
    [notificationId, userId],
  );
  return await database.get("SELECT * FROM notifications WHERE id = ? AND user_id = ?", [notificationId, userId]);
};

// Mark all notifications as read
const markAllAsRead = async (userId) => {
  const database = await initializeDb();
  await database.run("UPDATE notifications SET read = 1 WHERE user_id = ?", [
    userId,
  ]);
  return true;
};

// Get unread count
const getUnreadCount = async (userId) => {
  const database = await initializeDb();
  const result = await database.get(
    "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0",
    [userId],
  );
  return parseInt(result.count || 0);
};

// Delete notification
const deleteNotification = async (notificationId, userId) => {
  const database = await initializeDb();
  const result = await database.run(
    "DELETE FROM notifications WHERE id = ? AND user_id = ?",
    [notificationId, userId],
  );
  return result.changes > 0;
};

// Notification types
const NotificationTypes = {
  LOW_STOCK: "low_stock",
  EXPIRY_WARNING: "expiry_warning",
  SALE_COMPLETED: "sale_completed",
  NEW_PRODUCT: "new_product",
  SYSTEM: "system",
};

// Send low stock notification
const sendLowStockNotification = async (userId, product) => {
  return create({
    userId,
    type: NotificationTypes.LOW_STOCK,
    title: "Low Stock Alert",
    message: `${product.name} is running low. Current stock: ${product.stock_quantity}`,
    data: { productId: product.id, currentStock: product.stock_quantity },
    priority: "high",
  });
};

// Send expiry warning notification
const sendExpiryWarningNotification = async (
  userId,
  product,
  daysUntilExpiry,
) => {
  return create({
    userId,
    type: NotificationTypes.EXPIRY_WARNING,
    title: "Product Expiring Soon",
    message: `${product.name} will expire in ${daysUntilExpiry} days`,
    data: { productId: product.id, daysUntilExpiry },
    priority: "high",
  });
};

// Send sale notification
const sendSaleNotification = async (userId, sale) => {
  return create({
    userId,
    type: NotificationTypes.SALE_COMPLETED,
    title: "Sale Completed",
    message: `Transaction ${sale.transaction_number} completed. Total: ₱${sale.total_amount}`,
    data: { saleId: sale.id, totalAmount: sale.total_amount },
    priority: "normal",
  });
};

// Send bulk notification
const sendBulkNotification = async (
  userIds,
  { type, title, message, data },
) => {
  const sentNotifications = [];

  for (const userId of userIds) {
    const notification = await create({
      userId,
      type,
      title,
      message,
      data,
    });
    sentNotifications.push(notification);
  }

  return sentNotifications;
};

module.exports = {
  create,
  getByUser,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  NotificationTypes,
  sendLowStockNotification,
  sendExpiryWarningNotification,
  sendSaleNotification,
  sendBulkNotification,
};
