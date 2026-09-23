const productService = require("../services/product.service");
const {
  success,
  error,
  created,
  paginated,
  notFound,
} = require("../utils/apiResponse");
const {
  PRODUCT_ERRORS,
  SALES_ERRORS,
  SERVER_ERRORS,
} = require("../utils/errorConstants");

const create = async (req, res) => {
  try {
    const product = await productService.create(req.body, req.user.storeId);
    res.status(201).json(created(product, "Product created successfully"));
  } catch (err) {
    if (err.message.includes("already exists")) {
      return res
        .status(409)
        .json(
          error(
            PRODUCT_ERRORS.BARCODE_EXISTS.message,
            PRODUCT_ERRORS.BARCODE_EXISTS.code,
          ),
        );
    }
    res
      .status(400)
      .json(
        error(
          err.message || PRODUCT_ERRORS.PRODUCT_CREATE_FAILED.message,
          PRODUCT_ERRORS.PRODUCT_CREATE_FAILED.code,
        ),
      );
  }
};

const getAll = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const result = await productService.findAll(options);
    res.json(paginated(result.products, result.pagination));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getById = async (req, res) => {
  try {
    const product = await productService.findById(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json(notFound(PRODUCT_ERRORS.PRODUCT_NOT_FOUND.message));
    }
    res.json(success(product));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getByBarcode = async (req, res) => {
  try {
    const product = await productService.findByBarcode(req.params.barcode);
    if (!product) {
      return res
        .status(404)
        .json(notFound(PRODUCT_ERRORS.PRODUCT_NOT_FOUND.message));
    }
    res.json(success(product));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const update = async (req, res) => {
  try {
    const product = await productService.update(req.params.id, req.body);
    if (!product) {
      return res
        .status(404)
        .json(notFound(PRODUCT_ERRORS.PRODUCT_NOT_FOUND.message));
    }
    res.json(success(product, "Product updated successfully"));
  } catch (err) {
    if (err.message.includes("already exists")) {
      return res
        .status(409)
        .json(
          error(
            PRODUCT_ERRORS.BARCODE_EXISTS.message,
            PRODUCT_ERRORS.BARCODE_EXISTS.code,
          ),
        );
    }
    res
      .status(400)
      .json(
        error(
          err.message || PRODUCT_ERRORS.PRODUCT_UPDATE_FAILED.message,
          PRODUCT_ERRORS.PRODUCT_UPDATE_FAILED.code,
        ),
      );
  }
};

const deleteProduct = async (req, res) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) {
      return res
        .status(404)
        .json(notFound(PRODUCT_ERRORS.PRODUCT_NOT_FOUND.message));
    }
    res.json(success(null, "Product deleted successfully"));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const updateStock = async (req, res) => {
  try {
    const { quantityChange } = req.body;
    const product = await productService.updateStock(
      req.params.id,
      quantityChange,
    );
    if (!product) {
      return res
        .status(404)
        .json(notFound(PRODUCT_ERRORS.PRODUCT_NOT_FOUND.message));
    }
    res.json(success(product, "Stock updated successfully"));
  } catch (err) {
    if (err.message.includes("Insufficient")) {
      return res
        .status(400)
        .json(
          error(
            PRODUCT_ERRORS.INSUFFICIENT_STOCK.message,
            PRODUCT_ERRORS.INSUFFICIENT_STOCK.code,
          ),
        );
    }
    res.status(400).json(error(err.message, "VAL_001"));
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await productService.getCategories();
    res.json(success(categories));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getLowStock = async (req, res) => {
  try {
    const products = await productService.getLowStockProducts(req.user.storeId);
    res.json(
      success(products, `Found ${products.length} products with low stock`),
    );
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const bulkImport = async (req, res) => {
  try {
    const { products } = req.body;
    const result = await productService.bulkImport(products, req.user.storeId);
    res.json(
      success(result, `Successfully imported ${result.imported} products`),
    );
  } catch (err) {
    res.status(400).json(error(err.message, "VAL_001"));
  }
};

module.exports = {
  create,
  getAll,
  getById,
  getByBarcode,
  update,
  deleteProduct,
  updateStock,
  getCategories,
  getLowStock,
  bulkImport,
};
