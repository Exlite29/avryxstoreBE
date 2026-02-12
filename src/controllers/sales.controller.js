const salesService = require("../services/sales.service");
const { success, error, created, paginated } = require("../utils/apiResponse");

const createSale = async (req, res) => {
  try {
    const sale = await salesService.createSale({
      ...req.body,
      cashierId: req.user.id,
      storeId: req.user.storeId,
    });
    res.status(201).json(created(sale, "Sale completed successfully"));
  } catch (err) {
    res.status(400).json(error(err.message));
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
    res.status(500).json(error(err.message));
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await salesService.getSaleById(req.params.id, req.user.storeId);

    if (!sale) {
      return res.status(404).json(error("Sale not found"));
    }

    res.json(success(sale));
  } catch (err) {
    res.status(500).json(error(err.message));
  }
};

const getReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = "json" } = req.query;

    const sale = await salesService.getSaleById(id, req.user.storeId);
    if (!sale) {
      return res.status(404).json(error("Sale not found"));
    }

    // Get store name if needed
    const database = await initializeDb();
    const storeResult = await database.get("SELECT name FROM stores WHERE id = ?", [req.user.storeId]);
    const storeName = storeResult?.name || "Sari-Sari Store";

    const receiptService = require("../services/receipt.service");
    
    if (format === "text") {
      const textReceipt = receiptService.generateTextReceipt(sale, storeName);
      res.setHeader("Content-Type", "text/plain");
      return res.send(textReceipt);
    }

    const jsonReceipt = receiptService.generateJSONReceipt(sale, { name: storeName });
    res.json(success(jsonReceipt));
  } catch (err) {
    res.status(500).json(error(err.message));
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
    res.status(400).json(error(err.message));
  }
};

const getDailySummary = async (req, res) => {
  try {
    const summary = await salesService.getDailySummary(req.user.storeId);
    res.json(success(summary));
  } catch (err) {
    res.status(500).json(error(err.message));
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
