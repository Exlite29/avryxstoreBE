const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const { authenticateToken, requirePermission } = require("../middleware/auth");
const { handleValidationErrors } = require("../middleware/validation");

// All report routes require authentication and view_reports permission
router.use(authenticateToken);
router.use(requirePermission("view_reports"));

// Sales reports
router.get("/sales", handleValidationErrors, reportController.getSalesReport);
router.get(
  "/sales/top-products",
  handleValidationErrors,
  reportController.getTopProducts,
);
router.get("/sales/daily", reportController.getDailySalesSummary);
router.get(
  "/sales/cashflow",
  handleValidationErrors,
  reportController.getCashFlowReport,
);

// Inventory reports
router.get(
  "/inventory",
  handleValidationErrors,
  reportController.getInventoryReport,
);
router.get("/inventory/valuation", reportController.getInventoryReport);

// Scanner metrics
router.get(
  "/scanner/metrics",
  handleValidationErrors,
  reportController.getScannerMetrics,
);

module.exports = router;
