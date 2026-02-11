// Format currency (Philippine Peso)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

// Format date to local string
const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  return new Date(date).toLocaleDateString("en-PH", options || defaultOptions);
};

// Format datetime to local string
const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Generate unique transaction number
const generateTransactionNumber = (prefix = "TXN") => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `${prefix}-${date}-${random}`;
};

// Calculate discount percentage
const calculateDiscount = (originalPrice, discountedPrice) => {
  if (originalPrice <= 0) return 0;
  return (((originalPrice - discountedPrice) / originalPrice) * 100).toFixed(2);
};

// Parse barcode from various formats
const parseBarcode = (input) => {
  if (!input) return null;

  // Remove any spaces or dashes
  const cleaned = input.replace(/[\s\-]/g, "");

  // Validate it's alphanumeric
  if (!/^[A-Z0-9]+$/i.test(cleaned)) {
    return null;
  }

  return cleaned;
};

// Calculate stock status
const getStockStatus = (quantity, threshold) => {
  if (quantity <= 0) {
    return { status: "out_of_stock", label: "Out of Stock", color: "red" };
  }
  if (quantity <= threshold) {
    return { status: "low_stock", label: "Low Stock", color: "orange" };
  }
  return { status: "in_stock", label: "In Stock", color: "green" };
};

// Parse CSV data
const parseCSV = (csvString) => {
  const lines = csvString.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {});
  });
};

// Sleep utility for async operations
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Sanitize filename
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9\-_.]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 255);
};

// Parse JSON safely
const safeJSONParse = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
};

// Get relative time (e.g., "2 hours ago")
const getRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return formatDate(date);
};

module.exports = {
  formatCurrency,
  formatDate,
  formatDateTime,
  generateTransactionNumber,
  calculateDiscount,
  parseBarcode,
  getStockStatus,
  parseCSV,
  sleep,
  debounce,
  retryWithBackoff,
  isValidEmail,
  sanitizeFilename,
  safeJSONParse,
  getRelativeTime,
};
