const { initializeDatabase } = require("../config/database");
const {
  isValidBarcode,
  validateEAN13Checksum,
  validateEAN8Checksum,
  validateUPCAChecksum,
} = require("../config/scanner");
const bwipjs = require("bwip-js");

let db;
const initializeDb = async () => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

// Generate barcode image
const generateBarcodeImage = async ({
  barcode,
  format = "code128",
  scale = 3,
  height = 10,
}) => {
  try {
    const png = await bwipjs.toBuffer({
      bcid: format,
      text: barcode,
      scale: scale,
      height: height,
      includetext: true,
      textxalign: "center",
    });

    return {
      format: "png",
      data: png.toString("base64"),
      dataUrl: `data:image/png;base64,${png.toString("base64")}`,
    };
  } catch (error) {
    console.error("Barcode generation error:", error);
    throw new Error("Failed to generate barcode image");
  }
};

// Validate barcode checksum
const validateBarcode = (barcode) => {
  if (!isValidBarcode(barcode)) {
    return { valid: false, error: "Invalid barcode format" };
  }

  const length = barcode.length;
  let valid = true;
  let type = "unknown";

  // Check by length and format
  if (/^\d+$/.test(barcode)) {
    if (length === 13) {
      valid = validateEAN13Checksum(barcode);
      type = "EAN-13";
    } else if (length === 8) {
      valid = validateEAN8Checksum(barcode);
      type = "EAN-8";
    } else if (length === 12) {
      valid = validateUPCAChecksum(barcode);
      type = "UPC-A";
    } else if (length === 6 || length === 7 || length === 11) {
      type = "UPC-E";
    }
  } else if (/^[A-Z0-9\-\.\$\/\+\%\s]+$/i.test(barcode)) {
    if (length <= 43) {
      type = "Code 39";
    } else {
      type = "Code 128";
    }
  }

  return {
    valid,
    barcode,
    type,
    error: valid ? null : `Invalid ${type} checksum`,
  };
};

// Save barcode mapping
const saveBarcodeMapping = async ({
  barcode,
  productId,
  barcodeType,
  isPrimary = false,
}) => {
  const database = await initializeDb();

  // Check if barcode already exists
  const existing = await database.get(
    "SELECT id, product_id FROM barcodes WHERE barcode = ?",
    [barcode],
  );

  if (existing) {
    // Update existing mapping
    await database.run(
      `UPDATE barcodes 
       SET product_id = ?, barcode_type = ?, is_primary = ?
       WHERE barcode = ?`,
      [productId, barcodeType, isPrimary ? 1 : 0, barcode],
    );
    return await database.get("SELECT * FROM barcodes WHERE barcode = ?", [barcode]);
  }

  // Create new mapping
  const result = await database.run(
    `INSERT INTO barcodes (barcode, product_id, barcode_type, is_primary)
     VALUES (?, ?, ?, ?)`,
    [barcode, productId, barcodeType, isPrimary ? 1 : 0],
  );

  return await database.get("SELECT * FROM barcodes WHERE id = ?", [result.lastID]);
};

// Get product by barcode
const getProductByBarcode = async (barcode) => {
  const database = await initializeDb();
  const row = await database.get(
    `SELECT p.*, b.barcode_type, b.is_primary 
     FROM products p
     LEFT JOIN barcodes b ON p.id = b.product_id
     WHERE p.barcode = ? OR b.barcode = ?
     LIMIT 1`,
    [barcode, barcode],
  );

  return row || null;
};

// Get barcode mappings for a product
const getBarcodeMappings = async (productId) => {
  const database = await initializeDb();
  return await database.all(
    "SELECT * FROM barcodes WHERE product_id = ? ORDER BY is_primary DESC",
    [productId],
  );
};

// Delete barcode mapping
const deleteBarcodeMapping = async (barcode) => {
  const database = await initializeDb();
  const result = await database.run(
    "DELETE FROM barcodes WHERE barcode = ?",
    [barcode],
  );
  return result.changes > 0;
};

// Set primary barcode
const setPrimaryBarcode = async (productId, barcode) => {
  const database = await initializeDb();

  try {
    await database.run("BEGIN TRANSACTION");

    // Reset all barcodes for this product to non-primary
    await database.run(
      "UPDATE barcodes SET is_primary = 0 WHERE product_id = ?",
      [productId],
    );

    // Set new primary
    await database.run(
      "UPDATE barcodes SET is_primary = 1 WHERE product_id = ? AND barcode = ?",
      [productId, barcode],
    );

    // Also update product's primary barcode
    await database.run("UPDATE products SET barcode = ? WHERE id = ?", [
      barcode,
      productId,
    ]);

    await database.run("COMMIT");
    return true;
  } catch (error) {
    await database.run("ROLLBACK");
    throw error;
  }
};

// Search products by partial barcode
const searchByBarcode = async (partialBarcode) => {
  const database = await initializeDb();
  const rows = await database.all(
    `SELECT p.*, b.barcode_type
     FROM products p
     LEFT JOIN barcodes b ON p.id = b.product_id
     WHERE p.barcode LIKE ? OR b.barcode LIKE ?
     LIMIT 10`,
    [`%${partialBarcode}%`, `%${partialBarcode}%`],
  );
  return rows;
};

module.exports = {
  generateBarcodeImage,
  validateBarcode,
  saveBarcodeMapping,
  getProductByBarcode,
  getBarcodeMappings,
  deleteBarcodeMapping,
  setPrimaryBarcode,
  searchByBarcode,
};
