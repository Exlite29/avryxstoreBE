const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const { authenticateToken, requirePermission } = require("../middleware/auth");
const {
  handleValidationErrors,
  validateProduct,
} = require("../middleware/validation");
const {
  uploadProductImage,
  handleUploadError,
} = require("../middleware/upload");

// All routes require authentication
router.use(authenticateToken);

// Product CRUD
router.get("/", handleValidationErrors, productController.getAll);
router.get("/categories", productController.getCategories);
router.get("/low-stock", productController.getLowStock);
router.get("/barcode/:barcode", productController.getByBarcode);
router.get("/:id", productController.getById);

router.post(
  "/",
  requirePermission("manage_products"),
  validateProduct,
  productController.create,
);

router.post(
  "/bulk-import",
  requirePermission("manage_products"),
  handleValidationErrors,
  productController.bulkImport,
);

router.post(
  "/:id/images",
  requirePermission("manage_products"),
  uploadProductImage,
  handleUploadError,
  (req, res) => {
    const images = req.files.map((file) => file.path);
    res.json({ success: true, images });
  },
);

router.put(
  "/:id",
  requirePermission("manage_products"),
  handleValidationErrors,
  productController.update,
);

router.patch(
  "/:id/stock",
  requirePermission("manage_products"),
  handleValidationErrors,
  productController.updateStock,
);

router.delete(
  "/:id",
  requirePermission("manage_products"),
  productController.deleteProduct,
);

module.exports = router;
