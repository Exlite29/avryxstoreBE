const inventoryService = require("../services/inventory.service");
const { success, error, created, paginated } = require("../utils/apiResponse");

const addStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const inventory = await inventoryService.addStock(productId, req.body);
    res.status(201).json(created(inventory, "Stock added successfully"));
  } catch (err) {
    res.status(400).json(error(err.message));
  }
};

const removeStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, reason } = req.body;
    const result = await inventoryService.removeStock(productId, {
      quantity,
      reason,
    });
    res.json(success(result, "Stock removed successfully"));
  } catch (err) {
    res.status(400).json(error(err.message));
  }
};

const getInventory = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const result = await inventoryService.getAllInventory(options);
    res.json(paginated(result.inventory, result.pagination));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

const getProductInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const inventory = await inventoryService.getInventoryByProduct(productId);
    res.json(success(inventory));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

const adjustStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { adjustment, batchNumber, location, reason } = req.body;
    const inventory = await inventoryService.adjustStock(
      productId,
      { adjustment, batchNumber, location },
      reason,
    );
    res.json(success(inventory, "Stock adjusted successfully"));
  } catch (err) {
    res.status(400).json(error(err.message));
  }
};

const getStockMovements = async (req, res) => {
  try {
    const { productId } = req.params;
    const movements = await inventoryService.getStockMovements(
      productId,
      req.query,
    );
    res.json(success(movements));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

const getInventoryValuation = async (req, res) => {
  try {
    const valuation = await inventoryService.getInventoryValuation(
      req.user.storeId,
    );
    res.json(success(valuation));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

module.exports = {
  addStock,
  removeStock,
  getInventory,
  getProductInventory,
  adjustStock,
  getStockMovements,
  getInventoryValuation,
};
