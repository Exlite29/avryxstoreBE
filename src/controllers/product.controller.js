const productService = require("../services/product.service");
const { success, error, created, paginated } = require("../utils/apiResponse");

const create = async (req, res) => {
  try {
    const product = await productService.create(req.body, req.user.storeId);
    res.status(201).json(created(product, "Product created successfully"));
  } catch (err) {
    res.status(400).json(error(err.message));
  }
};

const getAll = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const result = await productService.findAll(options);
    res.json(paginated(result.products, result.pagination));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

const getById = async (req, res) => {
  try {
    const product = await productService.findById(req.params.id);
    if (!product) {
      return res.status(404).json(error("Product not found"));
    }
    res.json(success(product));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

const getByBarcode = async (req, res) => {
  try {
    const product = await productService.findByBarcode(req.params.barcode);
    if (!product) {
      return res.status(404).json(error("Product not found"));
    }
    res.json(success(product));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

const update = async (req, res) => {
  try {
    const product = await productService.update(req.params.id, req.body);
    if (!product) {
      return res.status(404).json(error("Product not found"));
    }
    res.json(success(product, "Product updated successfully"));
  } catch (err) {
    res.status(400).json(error(err.message));
  }
};

const deleteProduct = async (req, res) => {
  try {
    const deleted = await productService.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json(error("Product not found"));
    }
    res.json(success(null, "Product deleted successfully"));
  } catch (err) {
    res.status(500).json(error(err.message));
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
      return res.status(404).json(error("Product not found"));
    }
    res.json(success(product, "Stock updated successfully"));
  } catch (err) {
    res.status(400).json(error(err.message));
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await productService.getCategories();
    res.json(success(categories));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

const getLowStock = async (req, res) => {
  try {
    const products = await productService.getLowStockProducts(req.user.storeId);
    res.json(success(products));
  } catch (err) {
    res.status(500).json(error(err.message));
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
    res.status(400).json(error(err.message));
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
