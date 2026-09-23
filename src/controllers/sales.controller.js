const salesService = require("../services/sales.service");
const {
  success,
  error,
  created,
  paginated,
  notFound,
} = require("../utils/apiResponse");
const {
  SALES_ERRORS,
  SERVER_ERRORS,
  PRODUCT_ERRORS,
} = require("../utils/errorConstants");

const createSale = async (req, res) => {
  try {
    const sale = await salesService.createSale({
      ...req.body,
      cashierId: req.user.id,
      storeId: req.user.storeId,
    });
    res.status(201).json(created(sale, "Sale completed successfully"));
  } catch (err) {
    if (err.message.includes("Cart") || err.message.includes("empty")) {
      return res
        .status(400)
        .json(
          error(SALES_ERRORS.EMPTY_CART.message, SALES_ERRORS.EMPTY_CART.code),
        );
    }
    if (err.message.includes("Insufficient stock")) {
      return res
        .status(400)
        .json(
          error(
            PRODUCT_ERRORS.INSUFFICIENT_STOCK.message,
            PRODUCT_ERRORS.INSUFFICIENT_STOCK.code,
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

const getSales = async (req, res) => {
  try {
    const result = await salesService.getSales({
      ...req.query,
      storeId: req.user.storeId,
    });

    res.json(
      paginated(result.sales, {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      }),
    );
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await salesService.getSaleById(
      req.params.id,
      req.user.storeId,
    );

    if (!sale) {
      return res
        .status(404)
        .json(notFound(SALES_ERRORS.SALE_NOT_FOUND.message));
    }

    res.json(success(sale));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = "json" } = req.query;

    const sale = await salesService.getSaleById(id, req.user.storeId);
    if (!sale) {
      return res
        .status(404)
        .json(notFound(SALES_ERRORS.SALE_NOT_FOUND.message));
    }

    // Get store name if needed
    const database = await require("../config/database").initializeDatabase();
    const storeResult = await database.get(
      "SELECT name FROM stores WHERE id = ?",
      [req.user.storeId],
    );
    const storeName = storeResult?.name || "Sari-Sari Store";

    const receiptService = require("../services/receipt.service");

    if (format === "text") {
      const textReceipt = receiptService.generateTextReceipt(sale, storeName);
      res.setHeader("Content-Type", "text/plain");
      return res.send(textReceipt);
    }

    const jsonReceipt = receiptService.generateJSONReceipt(sale, {
      name: storeName,
    });
    res.json(success(jsonReceipt));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const cancelSale = async (req, res) => {
  try {
    const updatedSale = await salesService.cancelSale(
      req.params.id,
      req.body.reason,
      req.user.storeId,
    );
    res.json(success(updatedSale, "Sale cancelled successfully"));
  } catch (err) {
    if (err.message.includes("not found")) {
      return res
        .status(404)
        .json(notFound(SALES_ERRORS.SALE_NOT_FOUND.message));
    }
    res
      .status(400)
      .json(
        error(
          err.message || SALES_ERRORS.SALE_CANCEL_FAILED.message,
          SALES_ERRORS.SALE_CANCEL_FAILED.code,
        ),
      );
  }
};

const getDailySummary = async (req, res) => {
  try {
    const summary = await salesService.getDailySummary(req.user.storeId);
    res.json(success(summary));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  getReceipt,
  cancelSale,
  getDailySummary,
};
