const scannerService = require("../services/scanner.service");
const { success, error, scanned, notFound } = require("../utils/apiResponse");
const {
  SCANNER_ERRORS,
  SALES_ERRORS,
  SERVER_ERRORS,
  VALIDATION_ERRORS,
} = require("../utils/errorConstants");

const scanBarcode = async (req, res) => {
  try {
    const { barcode, image, scanType, deviceId, location } = req.body;
    const result = await scannerService.processBarcodeScan({
      barcode,
      image,
      scanType: scanType || "barcode",
      deviceId,
      location,
      userId: req.user.id,
      storeId: req.user.storeId,
    });

    if (result.success && result.recognized) {
      return res.json(
        scanned(result.product, {
          itemsScanned: 1,
          itemsRecognized: 1,
          scanMethod: result.scanMethod,
        }),
      );
    }

    res.json(
      success(
        result,
        result.recognized ? "Product found" : "Product not found",
      ),
    );
  } catch (err) {
    if (
      err.message.includes("not recognized") ||
      err.message.includes("invalid")
    ) {
      return res
        .status(400)
        .json(
          error(
            SCANNER_ERRORS.INVALID_BARCODE.message,
            SCANNER_ERRORS.INVALID_BARCODE.code,
          ),
        );
    }
    res
      .status(500)
      .json(
        error(
          err.message || SCANNER_ERRORS.SCAN_FAILED.message,
          SCANNER_ERRORS.SCAN_FAILED.code,
        ),
      );
  }
};

const scanImage = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json(
          error(
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.message,
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.code,
            { field: "image" },
          ),
        );
    }

    const { scanType = "image", deviceId, location } = req.body;
    const result = await scannerService.processBarcodeScan({
      image: req.file,
      scanType,
      deviceId,
      location,
      userId: req.user.id,
      storeId: req.user.storeId,
    });

    res.json(success(result, "Image scan processed"));
  } catch (err) {
    if (err.message.includes("processing") || err.message.includes("image")) {
      return res
        .status(400)
        .json(
          error(
            SCANNER_ERRORS.IMAGE_PROCESSING_FAILED.message,
            SCANNER_ERRORS.IMAGE_PROCESSING_FAILED.code,
          ),
        );
    }
    res
      .status(500)
      .json(
        error(
          err.message || SCANNER_ERRORS.SCAN_FAILED.message,
          SCANNER_ERRORS.SCAN_FAILED.code,
        ),
      );
  }
};

const bulkScan = async (req, res) => {
  try {
    const { items, deviceId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json(
          error(
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.message,
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.code,
            { field: "items" },
          ),
        );
    }

    const result = await scannerService.processBulkScan({
      items,
      deviceId,
      userId: req.user.id,
      storeId: req.user.storeId,
    });

    res.json(
      success(result, "Bulk scan completed", {
        itemsScanned: result.summary.total,
        itemsRecognized: result.summary.recognized,
        itemsUnrecognized: result.summary.unrecognized,
      }),
    );
  } catch (err) {
    res
      .status(500)
      .json(
        error(
          err.message || SCANNER_ERRORS.SCAN_FAILED.message,
          SCANNER_ERRORS.SCAN_FAILED.code,
        ),
      );
  }
};

const quickSale = async (req, res) => {
  try {
    const { items, paymentMethod, discount, customerId, notes } = req.body;
    const result = await scannerService.processQuickSale({
      items,
      paymentMethod,
      discount,
      customerId,
      notes,
      cashierId: req.user.id,
      storeId: req.user.storeId,
    });

    res.status(201).json(success(result.sale, "Quick sale completed"));
  } catch (err) {
    if (err.message.includes("Cart") || err.message.includes("empty")) {
      return res
        .status(400)
        .json(
          error(SALES_ERRORS.EMPTY_CART.message, SALES_ERRORS.EMPTY_CART.code),
        );
    }
    if (err.message.includes("payment")) {
      return res
        .status(400)
        .json(
          error(
            SALES_ERRORS.PAYMENT_FAILED.message,
            SALES_ERRORS.PAYMENT_FAILED.code,
          ),
        );
    }
    res
      .status(400)
      .json(
        error(
          err.message || SALES_ERRORS.SALE_CREATE_FAILED.message,
          SALES_ERRORS.SALE_CREATE_FAILED.code,
        ),
      );
  }
};

const getScanHistory = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const result = await scannerService.getScanHistory(options);
    res.json(success(result));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

module.exports = {
  scanBarcode,
  scanImage,
  bulkScan,
  quickSale,
  getScanHistory,
};
