const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventory.controller");
const { authenticateToken, requirePermission } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

// All routes require authentication
router.use(authenticateToken);

// Inventory routes
router.get(
  "/",
  requirePermission("manage_inventory"),
  handleValidationErrors,
  inventoryController.getInventory,
);
router.get(
  "/valuation",
  requirePermission("view_reports"),
  inventoryController.getInventoryValuation,
);
router.get("/product/:productId", inventoryController.getProductInventory);
router.get(
  "/product/:productId/movements",
  inventoryController.getStockMovements,
);

router.post(
  "/product/:productId/add",
  requirePermission("manage_inventory"),
  handleValidationErrors,
  inventoryController.addStock,
);

router.post(
  "/product/:productId/remove",
  requirePermission("manage_inventory"),
  handleValidationErrors,
  inventoryController.removeStock,
);

router.post(
  "/product/:productId/adjust",
  requirePermission("manage_inventory"),
  handleValidationErrors,
  inventoryController.adjustStock,
);

module.exports = router;
