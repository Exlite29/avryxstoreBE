const inventoryService = require("../services/inventory.service");
const {
  success,
  error,
  created,
  paginated,
  notFound,
} = require("../utils/apiResponse");
const {
  INVENTORY_ERRORS,
  PRODUCT_ERRORS,
  VALIDATION_ERRORS,
} = require("../utils/errorConstants");

const addStock = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!productId || productId === "undefined" || productId === "null") {
      return res
        .status(400)
        .json(
          error(
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.message,
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.code,
          ),
        );
    }

    const inventory = await inventoryService.addStock(productId, req.body);
    res.status(201).json(created(inventory, "Stock added successfully"));
  } catch (err) {
    if (err.message.includes("not found")) {
      return res
        .status(404)
        .json(
          error(
            PRODUCT_ERRORS.PRODUCT_NOT_FOUND.message,
            PRODUCT_ERRORS.PRODUCT_NOT_FOUND.code,
          ),
        );
    }
    res
      .status(400)
      .json(
        error(
          err.message || INVENTORY_ERRORS.INVENTORY_UPDATE_FAILED.message,
          INVENTORY_ERRORS.INVENTORY_UPDATE_FAILED.code,
        ),
      );
  }
};

const removeStock = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!productId || productId === "undefined" || productId === "null") {
      return res
        .status(400)
        .json(
          error(
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.message,
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.code,
          ),
        );
    }

    const { quantity, reason } = req.body;
    const result = await inventoryService.removeStock(productId, {
      quantity,
      reason,
    });
    res.json(success(result, "Stock removed successfully"));
  } catch (err) {
    if (err.message.includes("not found")) {
      return res
        .status(404)
        .json(
          error(
            PRODUCT_ERRORS.PRODUCT_NOT_FOUND.message,
            PRODUCT_ERRORS.PRODUCT_NOT_FOUND.code,
          ),
        );
    }
    if (
      err.message.includes("Insufficient stock") ||
      err.message.includes("cannot reduce")
    ) {
      return res
        .status(400)
        .json(
          error(
            INVENTORY_ERRORS.NEGATIVE_STOCK.message,
            INVENTORY_ERRORS.NEGATIVE_STOCK.code,
          ),
        );
    }
    res
      .status(400)
      .json(
        error(
          err.message || INVENTORY_ERRORS.ADJUSTMENT_FAILED.message,
          INVENTORY_ERRORS.ADJUSTMENT_FAILED.code,
        ),
      );
  }
};

const getInventory = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const result = await inventoryService.getAllInventory(options);
    res.json(paginated(result.inventory, result.pagination));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getProductInventory = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!productId || productId === "undefined" || productId === "null") {
      return res
        .status(400)
        .json(
          error(
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.message,
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.code,
          ),
        );
    }

    const inventory = await inventoryService.getInventoryByProduct(productId);
    res.json(success(inventory));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const adjustStock = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!productId || productId === "undefined" || productId === "null") {
      return res
        .status(400)
        .json(
          error(
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.message,
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.code,
          ),
        );
    }

    const { adjustment, batchNumber, location, reason } = req.body;
    const inventory = await inventoryService.adjustStock(
      productId,
      { adjustment, batchNumber, location },
      reason,
    );
    res.json(success(inventory, "Stock adjusted successfully"));
  } catch (err) {
    if (err.message.includes("not found")) {
      return res
        .status(404)
        .json(
          error(
            PRODUCT_ERRORS.PRODUCT_NOT_FOUND.message,
            PRODUCT_ERRORS.PRODUCT_NOT_FOUND.code,
          ),
        );
    }
    res
      .status(400)
      .json(
        error(
          err.message || INVENTORY_ERRORS.ADJUSTMENT_FAILED.message,
          INVENTORY_ERRORS.ADJUSTMENT_FAILED.code,
        ),
      );
  }
};

const getStockMovements = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!productId || productId === "undefined" || productId === "null") {
      return res
        .status(400)
        .json(
          error(
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.message,
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.code,
          ),
        );
    }

    const movements = await inventoryService.getStockMovements(
      productId,
      req.query,
    );
    res.json(success(movements));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getInventoryValuation = async (req, res) => {
  try {
    const valuation = await inventoryService.getInventoryValuation(
      req.user.storeId,
    );
    res.json(success(valuation));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
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
