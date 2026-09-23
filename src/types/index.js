// TypeScript definitions for the Sari-Sari Store Management System

/**
 * @typedef {Object} Product
 * @property {string} id - Unique identifier
 * @property {string} barcode - Product barcode
 * @property {string} name - Product name
 * @property {string} description - Product description
 * @property {string} category - Product category
 * @property {number} unit_price - Unit price
 * @property {number} wholesale_price - Wholesale price
 * @property {number} stock_quantity - Current stock quantity
 * @property {number} low_stock_threshold - Low stock threshold
 * @property {string[]} image_urls - Array of image URLs
 * @property {string} barcode_image_url - Barcode image URL
 * @property {string} supplier_id - Supplier ID
 * @property {Date} expiry_date - Expiry date
 * @property {string} store_id - Store ID
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} User
 * @property {string} id - Unique identifier
 * @property {string} email - User email
 * @property {string} password_hash - Hashed password
 * @property {string} full_name - Full name
 * @property {string} role - User role (owner, manager, cashier)
 * @property {string} store_id - Store ID
 * @property {boolean} is_active - Account status
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} Sale
 * @property {string} id - Unique identifier
 * @property {string} transaction_number - Transaction number
 * @property {string} customer_id - Customer ID
 * @property {string} cashier_id - Cashier ID
 * @property {number} subtotal - Subtotal amount
 * @property {number} discount - Discount amount
 * @property {number} tax - Tax amount
 * @property {number} total_amount - Total amount
 * @property {string} payment_method - Payment method
 * @property {number} payment_received - Payment received
 * @property {number} change_given - Change given
 * @property {string} status - Sale status
 * @property {string} notes - Additional notes
 * @property {string} store_id - Store ID
 * @property {Date} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Inventory
 * @property {string} id - Unique identifier
 * @property {string} product_id - Product ID
 * @property {number} quantity - Quantity
 * @property {string} batch_number - Batch number
 * @property {Date} expiry_date - Expiry date
 * @property {string} location - Storage location
 * @property {string} store_id - Store ID
 * @property {Date} created_at - Creation timestamp
 * @property {Date} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} Scan
 * @property {string} id - Unique identifier
 * @property {string} scan_type - Scan type (barcode, image)
 * @property {string} input_data - Input data (barcode number or image data)
 * @property {string} product_id - Product ID
 * @property {number} confidence_score - Confidence score for image recognition
 * @property {string} scanned_by - User ID who performed the scan
 * @property {string} store_id - Store ID
 * @property {string} device_id - Device ID
 * @property {Object} location - GPS coordinates
 * @property {Date} created_at - Creation timestamp
 */

module.exports = {};