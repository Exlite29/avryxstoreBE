// Product validation schemas
const createProductSchema = {
  name: {
    trim: true,
    isLength: { min: 1, max: 255 },
    errorMessage: "Product name is required (max 255 characters)",
  },
  barcode: {
    optional: true,
    trim: true,
    isLength: { max: 50 },
    errorMessage: "Barcode must be less than 50 characters",
  },
  description: {
    optional: true,
    trim: true,
    isLength: { max: 2000 },
    errorMessage: "Description must be less than 2000 characters",
  },
  category: {
    optional: true,
    trim: true,
    isLength: { max: 100 },
    errorMessage: "Category must be less than 100 characters",
  },
  unit_price: {
    isFloat: { min: 0 },
    toFloat: true,
    errorMessage: "Unit price must be a positive number",
  },
  wholesale_price: {
    optional: true,
    isFloat: { min: 0 },
    toFloat: true,
    errorMessage: "Wholesale price must be a positive number",
  },
  stock_quantity: {
    optional: true,
    isInt: { min: 0 },
    toInt: true,
    errorMessage: "Stock quantity must be a non-negative integer",
  },
  low_stock_threshold: {
    optional: true,
    isInt: { min: 0 },
    toInt: true,
    errorMessage:
      "Low stock threshold must be a non-negative integer (0 allowed)",
  },
  supplier_id: {
    optional: true,
    isUUID: true,
    errorMessage: "Supplier ID must be a valid UUID",
  },
  expiry_date: {
    optional: true,
    isISO8601: true,
    toDate: true,
    errorMessage: "Expiry date must be a valid date",
  },
};

const updateProductSchema = {
  name: {
    optional: true,
    trim: true,
    isLength: { min: 1, max: 255 },
    errorMessage: "Product name must be less than 255 characters",
  },
  barcode: {
    optional: true,
    trim: true,
    isLength: { max: 50 },
    errorMessage: "Barcode must be less than 50 characters",
  },
  description: {
    optional: true,
    trim: true,
    isLength: { max: 2000 },
    errorMessage: "Description must be less than 2000 characters",
  },
  category: {
    optional: true,
    trim: true,
    isLength: { max: 100 },
    errorMessage: "Category must be less than 100 characters",
  },
  unit_price: {
    optional: true,
    isFloat: { min: 0 },
    toFloat: true,
    errorMessage: "Unit price must be a positive number",
  },
  wholesale_price: {
    optional: true,
    isFloat: { min: 0 },
    toFloat: true,
    errorMessage: "Wholesale price must be a positive number",
  },
  stock_quantity: {
    optional: true,
    isInt: { min: 0 },
    toInt: true,
    errorMessage: "Stock quantity must be a non-negative integer",
  },
  low_stock_threshold: {
    optional: true,
    isInt: { min: 0 },
    toInt: true,
    errorMessage:
      "Low stock threshold must be a non-negative integer (0 allowed)",
  },
  supplier_id: {
    optional: true,
    isUUID: true,
    errorMessage: "Supplier ID must be a valid UUID",
  },
  expiry_date: {
    optional: true,
    isISO8601: true,
    toDate: true,
    errorMessage: "Expiry date must be a valid date",
  },
  image_urls: {
    optional: true,
    isArray: { min: 0 },
    errorMessage: "Image URLs must be an array",
  },
  barcode_image_url: {
    optional: true,
    isURL: true,
    errorMessage: "Barcode image URL must be a valid URL",
  },
};

const productQuerySchema = {
  page: {
    optional: true,
    isInt: { min: 1 },
    toInt: true,
    errorMessage: "Page must be a positive integer",
  },
  limit: {
    optional: true,
    isInt: { min: 1, max: 100 },
    toInt: true,
    errorMessage: "Limit must be between 1 and 100",
  },
  category: {
    optional: true,
    trim: true,
    isLength: { max: 100 },
  },
  search: {
    optional: true,
    trim: true,
    isLength: { max: 100 },
  },
  low_stock: {
    optional: true,
    isBoolean: true,
    toBoolean: true,
  },
  sortBy: {
    optional: true,
    isIn: ["name", "unit_price", "stock_quantity", "created_at", "category"],
  },
  sortOrder: {
    optional: true,
    isIn: ["ASC", "DESC", "asc", "desc"],
  },
};

const bulkImportSchema = {
  products: {
    isArray: { min: 1 },
    errorMessage: "Products array is required",
  },
  "products.*.name": {
    trim: true,
    isLength: { min: 1, max: 255 },
    errorMessage: "Product name is required",
  },
  "products.*.barcode": {
    optional: true,
    trim: true,
    isLength: { max: 50 },
  },
  "products.*.description": {
    optional: true,
    trim: true,
    isLength: { max: 2000 },
  },
  "products.*.category": {
    optional: true,
    trim: true,
    isLength: { max: 100 },
  },
  "products.*.unit_price": {
    isFloat: { min: 0 },
    toFloat: true,
    errorMessage: "Valid unit price is required",
  },
  "products.*.wholesale_price": {
    optional: true,
    isFloat: { min: 0 },
    toFloat: true,
  },
  "products.*.stock_quantity": {
    optional: true,
    isInt: { min: 0 },
    toInt: true,
  },
  "products.*.low_stock_threshold": {
    optional: true,
    isInt: { min: 0 },
    toInt: true,
  },
  "products.*.supplier_id": {
    optional: true,
    isUUID: true,
  },
  "products.*.expiry_date": {
    optional: true,
    isISO8601: true,
    toDate: true,
  },
};

module.exports = {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  bulkImportSchema,
};
