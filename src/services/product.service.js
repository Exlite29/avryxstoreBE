const { initializeDatabase } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

// We'll initialize the database connection when needed
let db;

const initializeDb = async () => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

const create = async (productData, storeId) => {
  const database = await initializeDb();

  const {
    barcode,
    name,
    description,
    category,
    unit_price,
    wholesale_price,
    stock_quantity = 0,
    low_stock_threshold = 10,
    image_urls,
    barcode_image_url,
    supplier_id,
    expiry_date,
  } = productData;

  let finalBarcodeImageUrl = barcode_image_url;

  // Automatically generate barcode image if not provided
  if (barcode && !finalBarcodeImageUrl) {
    try {
      const barcodeService = require("./barcode.service");
      const { uploadBase64Image } = require("../config/cloudinary");

      const barcodeData = await barcodeService.generateBarcodeImage({
        barcode,
      });
      const uploadResult = await uploadBase64Image(
        barcodeData.dataUrl,
        "barcodes",
      );
      finalBarcodeImageUrl = uploadResult.url;
    } catch (error) {
      console.error("Auto barcode generation failed:", error);
      // Fallback: leave it null or use a default
    }
  }

  const result = await database.run(
    `INSERT INTO products
     (barcode, name, description, category, unit_price, wholesale_price,
      stock_quantity, low_stock_threshold, image_urls, barcode_image_url,
      supplier_id, expiry_date, store_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      barcode,
      name,
      description,
      category,
      unit_price,
      wholesale_price,
      stock_quantity,
      low_stock_threshold,
      JSON.stringify(image_urls || []),
      finalBarcodeImageUrl,
      supplier_id,
      expiry_date,
      storeId,
    ],
  );

  const product = await database.get("SELECT * FROM products WHERE id = ?", [
    result.lastID,
  ]);

  return product;
};

const findById = async (id) => {
  const database = await initializeDb();
  const product = await database.get("SELECT * FROM products WHERE id = ?", [
    id,
  ]);
  return product || null;
};

const findByBarcode = async (barcode) => {
  const database = await initializeDb();
  const product = await database.get(
    "SELECT * FROM products WHERE barcode = ?",
    [barcode],
  );
  return product || null;
};

const findAll = async (options = {}) => {
  const database = await initializeDb();

  const {
    page = 1,
    limit = 20,
    category,
    search,
    lowStock,
    sortBy = "created_at",
    sortOrder = "DESC",
  } = options;

  const offset = (page - 1) * limit;
  const conditions = ["(store_id IS NULL OR store_id = ?)"];
  const params = [options.storeId || null];

  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }

  if (search) {
    conditions.push("(name LIKE ? OR barcode LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  if (lowStock) {
    conditions.push("stock_quantity <= low_stock_threshold");
  }

  const whereClause = conditions.join(" AND ");
  const validSortFields = [
    "name",
    "unit_price",
    "stock_quantity",
    "created_at",
    "category",
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
  const order = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

  // Get total count
  const countQuery = `SELECT COUNT(*) as count FROM products WHERE ${whereClause}`;
  const countResult = await database.get(countQuery, params);
  const total = countResult.count;

  // Get paginated results
  const resultQuery = `SELECT 
    id, barcode, name, description, category, unit_price, wholesale_price,
    COALESCE(stock_quantity, 0) as stock_quantity, low_stock_threshold, 
    image_urls, barcode_image_url, supplier_id, expiry_date, store_id, 
    created_at, updated_at 
   FROM products
                       WHERE ${whereClause}
                       ORDER BY ${sortField} ${order}
                       LIMIT ? OFFSET ?`;
  const products = await database.all(resultQuery, [...params, limit, offset]);

  return {
    products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const update = async (id, productData) => {
  const database = await initializeDb();

  const {
    barcode,
    name,
    description,
    category,
    unit_price,
    wholesale_price,
    stock_quantity,
    low_stock_threshold,
    image_urls,
    barcode_image_url,
    supplier_id,
    expiry_date,
  } = productData;

  let finalBarcodeImageUrl = barcode_image_url;

  // Regenerate barcode image if barcode changed and no URL provided
  if (barcode && !finalBarcodeImageUrl) {
    try {
      const barcodeService = require("./barcode.service");
      const { uploadBase64Image } = require("../config/cloudinary");

      const barcodeData = await barcodeService.generateBarcodeImage({
        barcode,
      });
      const uploadResult = await uploadBase64Image(
        barcodeData.dataUrl,
        "barcodes",
      );
      finalBarcodeImageUrl = uploadResult.url;
    } catch (error) {
      console.error("Auto barcode regeneration failed:", error);
    }
  }

  await database.run(
    `UPDATE products
     SET barcode = COALESCE(?, barcode),
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         category = COALESCE(?, category),
         unit_price = COALESCE(?, unit_price),
         wholesale_price = COALESCE(?, wholesale_price),
         stock_quantity = COALESCE(?, stock_quantity),
         low_stock_threshold = COALESCE(?, low_stock_threshold),
         image_urls = COALESCE(?, image_urls),
         barcode_image_url = COALESCE(?, barcode_image_url),
         supplier_id = COALESCE(?, supplier_id),
         expiry_date = COALESCE(?, expiry_date),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      barcode,
      name,
      description,
      category,
      unit_price,
      wholesale_price,
      stock_quantity,
      low_stock_threshold,
      JSON.stringify(image_urls),
      finalBarcodeImageUrl,
      supplier_id,
      expiry_date,
      id,
    ],
  );

  const product = await database.get("SELECT * FROM products WHERE id = ?", [
    id,
  ]);
  return product || null;
};

const deleteProduct = async (id) => {
  const database = await initializeDb();
  const result = await database.run("DELETE FROM products WHERE id = ?", [id]);
  return result.changes > 0;
};

const updateStock = async (id, quantityChange) => {
  const database = await initializeDb();

  await database.run(
    `UPDATE products
     SET stock_quantity = stock_quantity + ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [quantityChange, id],
  );

  const product = await database.get("SELECT * FROM products WHERE id = ?", [
    id,
  ]);
  return product || null;
};

const getCategories = async () => {
  const database = await initializeDb();
  const rows = await database.all(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category",
  );
  return rows.map((row) => row.category);
};

const getLowStockProducts = async (storeId) => {
  const database = await initializeDb();
  const products = await database.all(
    `SELECT * FROM products
     WHERE (store_id IS NULL OR store_id = ?)
     AND stock_quantity <= low_stock_threshold
     ORDER BY stock_quantity ASC`,
    [storeId],
  );
  return products;
};

const bulkImport = async (products, storeId) => {
  const database = await initializeDb();
  const results = [];

  try {
    // Begin transaction
    await database.run("BEGIN TRANSACTION");

    for (const product of products) {
      const result = await database.run(
        `INSERT INTO products
         (barcode, name, description, category, unit_price, wholesale_price,
          stock_quantity, low_stock_threshold, store_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.barcode,
          product.name,
          product.description,
          product.category,
          product.unit_price || product.unitPrice,
          product.wholesale_price || product.wholesalePrice,
          product.stock_quantity || product.stockQuantity || 0,
          product.low_stock_threshold || product.lowStockThreshold || 10,
          storeId,
        ],
      );

      const insertedProduct = await database.get(
        "SELECT * FROM products WHERE id = ?",
        [result.lastID],
      );
      results.push(insertedProduct);
    }

    // Commit transaction
    await database.run("COMMIT");
    return { success: true, imported: results.length, products: results };
  } catch (error) {
    // Rollback transaction
    await database.run("ROLLBACK");
    throw error;
  }
};

module.exports = {
  create,
  findById,
  findByBarcode,
  findAll,
  update,
  deleteProduct,
  updateStock,
  getCategories,
  getLowStockProducts,
  bulkImport,
};
