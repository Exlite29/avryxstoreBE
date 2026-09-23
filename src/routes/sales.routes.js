const express = require("express");
const router = express.Router();
const salesController = require("../controllers/sales.controller");
const { authenticateToken, requirePermission } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");
const {
  createSaleSchema,
  saleQuerySchema,
} = require("../validations/sales.validation");

// All routes require authentication
router.use(authenticateToken);

// Sales routes
router.get(
  "/",
  requirePermission("view_reports"),
  handleValidationErrors,
  salesController.getSales,
);

router.get(
  "/daily-summary",
  requirePermission("view_reports"),
  salesController.getDailySummary,
);

router.get(
  "/:id",
  requirePermission("manage_sales"),
  salesController.getSaleById,
);

router.post(
  "/",
  requirePermission("manage_sales"),
  handleValidationErrors,
  salesController.createSale,
);

router.get(
  "/:id/receipt",
  requirePermission("manage_sales"),
  salesController.getReceipt,
);

router.post(
  "/:id/cancel",
  requirePermission("manage_sales"),
  handleValidationErrors,
  salesController.cancelSale,
);

module.exports = router;
