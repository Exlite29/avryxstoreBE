// Utility validators for the Sari-Sari Store Management System

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether email is valid
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether phone number is valid
 */
const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate barcode format
 * @param {string} barcode - Barcode to validate
 * @returns {boolean} - Whether barcode is valid
 */
const validateBarcode = (barcode) => {
  // UPC-A, EAN-13: 12 or 13 digits
  const upcPattern = /^\d{12,13}$/;
  // EAN-8: 8 digits
  const ean8Pattern = /^\d{8}$/;
  // Code 39: Only uppercase letters, numbers, and limited special chars
  const code39Pattern = /^[A-Z0-9\-\.\$\/\+\%\s]+$/i;

  const cleaned = barcode.trim();

  if (cleaned.length === 0) {
    return false;
  }

  // Special characters only test (for validation purposes)
  const specialCharsOnly = /^[\-\.\$\/\+\%\s]+$/;

  // Reject if only special characters
  if (specialCharsOnly.test(cleaned)) {
    return false;
  }

  return (
    upcPattern.test(cleaned) ||
    ean8Pattern.test(cleaned) ||
    code39Pattern.test(cleaned)
  );
};

/**
 * Validate price format
 * @param {number|string} price - Price to validate
 * @returns {boolean} - Whether price is valid
 */
const validatePrice = (price) => {
  if (typeof price === 'string') {
    price = parseFloat(price);
  }

  return !isNaN(price) && price >= 0 && price <= 999999.99;
};

/**
 * Validate quantity
 * @param {number|string} quantity - Quantity to validate
 * @returns {boolean} - Whether quantity is valid
 */
const validateQuantity = (quantity) => {
  if (typeof quantity === 'string') {
    quantity = parseInt(quantity, 10);
  }

  return !isNaN(quantity) && quantity >= 0 && quantity <= 999999;
};

module.exports = {
  validateEmail,
  validatePhone,
  validateBarcode,
  validatePrice,
  validateQuantity
};