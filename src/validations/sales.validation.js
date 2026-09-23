// Sales validation schemas
const createSaleSchema = {
  items: {
    isArray: { min: 1 },
    errorMessage: "At least one item is required",
  },
  "items.*.product_id": {
    isInt: { min: 1 },
    toInt: true,
    errorMessage: "Valid product ID is required for each item",
  },
  "items.*.quantity": {
    isInt: { min: 1 },
    toInt: true,
    errorMessage: "Quantity must be at least 1 for each item",
  },
  "items.*.unit_price": {
    optional: true,
    isFloat: { min: 0 },
    toFloat: true,
  },
  payment_method: {
    isIn: ["cash", "card", "gcash", "paymaya", "credit"],
    errorMessage: "Invalid payment method",
  },
  amount_paid: {
    isFloat: { min: 0 },
    toFloat: true,
    errorMessage: "Amount paid must be a non-negative number",
  },
  discount: {
    optional: true,
    isFloat: { min: 0 },
    toFloat: true,
    errorMessage: "Discount must be a non-negative number",
  },
  tax: {
    optional: true,
    isFloat: { min: 0 },
    toFloat: true,
    errorMessage: "Tax must be a non-negative number",
  },
  customer_id: {
    optional: true,
    isInt: { min: 1 },
    toInt: true,
    errorMessage: "Customer ID must be a valid number",
  },
  notes: {
    optional: true,
    trim: true,
    isLength: { max: 1000 },
    errorMessage: "Notes must be less than 1000 characters",
  },
};

const saleQuerySchema = {
  start_date: {
    optional: true,
    isISO8601: true,
    toDate: true,
    errorMessage: "Start date must be a valid date",
  },
  end_date: {
    optional: true,
    isISO8601: true,
    toDate: true,
    errorMessage: "End date must be a valid date",
  },
  status: {
    optional: true,
    isIn: ["pending", "completed", "cancelled", "refunded"],
    errorMessage: "Invalid status",
  },
  payment_method: {
    optional: true,
    isIn: ["cash", "card", "gcash", "paymaya", "credit"],
  },
  page: {
    optional: true,
    isInt: { min: 1 },
    toInt: true,
  },
  limit: {
    optional: true,
    isInt: { min: 1, max: 100 },
    toInt: true,
  },
};

const saleReturnSchema = {
  items: {
    isArray: { min: 1 },
    errorMessage: "At least one item is required for return",
  },
  "items.*.sale_item_id": {
    isUUID: true,
    errorMessage: "Valid sale item ID is required",
  },
  "items.*.quantity": {
    isInt: { min: 1 },
    toInt: true,
    errorMessage: "Return quantity must be at least 1",
  },
  reason: {
    optional: true,
    trim: true,
    isLength: { max: 500 },
  },
};

const cancelSaleSchema = {
  reason: {
    optional: true,
    trim: true,
    isLength: { max: 500 },
  },
};

module.exports = {
  createSaleSchema,
  saleQuerySchema,
  saleReturnSchema,
  cancelSaleSchema,
};
