const scannerService = require("../services/scanner.service");
const { success, error, scanned } = require("../utils/apiResponse");

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
    res.status(500).json(error(err.message));
  }
};

const scanImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(error("No image file provided"));
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
    res.status(500).json(error(err.message));
  }
};

const bulkScan = async (req, res) => {
  try {
    const { items, deviceId } = req.body;
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
    res.status(500).json(error(err.message));
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
    res.status(400).json(error(err.message));
  }
};

const getScanHistory = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const result = await scannerService.getScanHistory(options);
    res.json(success(result));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

module.exports = {
  scanBarcode,
  scanImage,
  bulkScan,
  quickSale,
  getScanHistory,
};
