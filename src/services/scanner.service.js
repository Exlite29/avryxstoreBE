const { initializeDatabase } = require("../config/database");
const {
  decodeBarcodeFromBuffer,
  decodeBarcodeFromImage,
  isValidBarcode,
} = require("../config/scanner");
const { uploadImage, uploadBase64Image } = require("../config/cloudinary");
const salesService = require("./sales.service");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
const path = require("path");

// We'll initialize the database connection when needed
let db;

const initializeDb = async () => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

// Process single barcode scan
const processBarcodeScan = async ({
  barcode,
  image,
  scanType,
  deviceId,
  location,
  userId,
  storeId,
}) => {
  const database = await initializeDb();

  let detectedBarcode = null;
  let scanMethod = "barcode";
  let imageData = null;

  // If image is provided, decode barcode from image
  if (image) {
    const tempFileName = `${uuidv4()}.jpg`;
    const tempPath = path.join("/tmp", tempFileName); // Standardize path

    try {
      // Save base64 image to temp file
      if (typeof image === "string" && image.startsWith("data:image")) {
        const base64Data = image.split(",")[1];
        await sharp(Buffer.from(base64Data, "base64"))
          .jpeg({ quality: 85 })
          .toFile(tempPath);
      } else {
        // Handle Buffer or raw base64
        const buffer = Buffer.isBuffer(image) ? image : Buffer.from(image, "base64");
        await sharp(buffer)
          .jpeg({ quality: 85 })
          .toFile(tempPath);
      }

      // Decode barcode from image
      const decodeResult = await decodeBarcodeFromImage(tempPath);

      if (decodeResult) {
        detectedBarcode = decodeResult.text;
        scanMethod = "image";

        // Upload image to cloud storage
        try {
          imageData = await uploadImage(tempPath, "scans");
        } catch (uploadError) {
          console.error("Failed to upload scan image:", uploadError);
        }
      }

      // Properly delete temp file
      try {
        await fs.unlink(tempPath);
      } catch (unlinkError) {
        console.error("Failed to delete temp file:", unlinkError);
      }
    } catch (error) {
      console.error("Error processing barcode image:", error);
    }
  }

  // If barcode was provided directly, use it
  if (barcode) {
    detectedBarcode = barcode;
    scanMethod = "barcode";
  }

  if (!detectedBarcode) {
    return {
      success: false,
      error: "No barcode detected",
      suggestion: "Please ensure the barcode is clearly visible and try again.",
    };
  }

  // Validate barcode format
  if (!isValidBarcode(detectedBarcode)) {
    return {
      success: false,
      error: "Invalid barcode format",
      detected: detectedBarcode,
    };
  }

  // Look up product by barcode
  const productResult = await database.get(
    "SELECT * FROM products WHERE barcode = ?",
    [detectedBarcode]
  );

  // Record the scan
  const scanRecord = await database.run(
    `INSERT INTO product_scans
     (scan_type, input_data, product_id, confidence_score, scanned_by, store_id, device_id, location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      scanMethod,
      detectedBarcode,
      productResult?.id || null,
      scanMethod === "image" ? 0.85 : 1.0,
      userId,
      storeId,
      deviceId,
      location ? (typeof location === "string" ? JSON.stringify(location) : JSON.stringify(location)) : null,
    ]
  );

  // Get the inserted scan record
  const insertedScan = await database.get(
    "SELECT * FROM product_scans WHERE id = ?",
    [scanRecord.lastID]
  );

  if (!productResult) {
    return {
      success: true,
      scan: insertedScan,
      product: null,
      recognized: false,
      message: "Product not found in inventory. Would you like to add it?",
    };
  }

  const product = productResult;
  return {
    success: true,
    scan: insertedScan,
    product: {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      price: product.unit_price,
      stock: product.stock_quantity,
      imageUrl: product.image_urls ? JSON.parse(product.image_urls)[0] : null,
      category: product.category,
    },
    recognized: true,
    scanMethod,
    confidence: scanMethod === "image" ? 0.85 : 1.0,
    imageUrl: imageData?.secure_url,
  };
};

// Process bulk barcode scan
const processBulkScan = async ({ items, deviceId, userId, storeId }) => {
  const results = [];
  let recognized = 0;
  let unrecognized = 0;

  for (const item of items) {
    const result = await processBarcodeScan({
      barcode: item.barcode,
      image: item.image,
      scanType:
        item.barcode && item.image
          ? "both"
          : item.barcode
            ? "barcode"
            : "image",
      deviceId,
      userId,
      storeId,
    });

    results.push({
      input: item,
      result,
    });

    if (result.recognized) {
      recognized++;
    } else {
      unrecognized++;
    }
  }

  return {
    success: true,
    results,
    summary: {
      total: items.length,
      recognized,
      unrecognized,
    },
  };
};

// Quick sale via scan - Now uses salesService
const processQuickSale = async ({
  items,
  paymentMethod,
  discount = 0,
  cashierId,
  storeId,
}) => {
  try {
    const result = await salesService.createSale({
      items: items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unitPrice: item.priceOverride
      })),
      paymentMethod,
      discount,
      cashierId,
      storeId,
      notes: "Quick sale via scanner"
    });

    return {
      success: true,
      sale: result
    };
  } catch (error) {
    console.error("Quick sale failed:", error);
    throw error;
  }
};

// Get scan history
const getScanHistory = async (options = {}) => {
  const database = await initializeDb();

  const { page = 1, limit = 20, productId, startDate, endDate, storeId } = options;
  const offset = (page - 1) * limit;

  let query = `
    SELECT ps.*, p.name as product_name, p.barcode as product_barcode
    FROM product_scans ps
    LEFT JOIN products p ON ps.product_id = p.id
    WHERE (ps.store_id IS NULL OR ps.store_id = ?)
  `;
  const params = [storeId || null];
  let paramIndex = 2;

  if (productId) {
    query += ` AND ps.product_id = ?`;
    params.push(productId);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND ps.created_at >= ?`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND ps.created_at <= ?`;
    params.push(endDate);
    paramIndex++;
  }

  // For SQLite, we need to use a different approach for counting
  const countQuery = query.replace(
    "SELECT ps.*, p.name as product_name, p.barcode as product_barcode",
    "SELECT COUNT(*) as count"
  );

  const countResult = await database.get(countQuery, params);
  const total = parseInt(countResult.count);

  query += ` ORDER BY ps.created_at DESC LIMIT ? OFFSET ?`;
  const finalParams = [...params, parseInt(limit), offset];

  const result = await database.all(query, finalParams);

  return {
    scans: result,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  processBarcodeScan,
  processBulkScan,
  processQuickSale,
  getScanHistory,
};