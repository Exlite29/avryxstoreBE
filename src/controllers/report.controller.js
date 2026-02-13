const reportService = require("../services/report.service");
const { success, error } = require("../utils/apiResponse");
const { SERVER_ERRORS } = require("../utils/errorConstants");

const getSalesReport = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const report = await reportService.getSalesReport(options);
    res.json(success(report));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getTopProducts = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const report = await reportService.getTopProductsReport(options);
    res.json(success(report));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const report = await reportService.getInventoryReport(options);
    res.json(success(report));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getDailySalesSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const summary = await reportService.getDailySalesSummary(
      targetDate,
      req.user.storeId,
    );
    res.json(success(summary));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getCashFlowReport = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const report = await reportService.getCashFlowReport(options);
    res.json(success(report));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

const getScannerMetrics = async (req, res) => {
  try {
    const options = { ...req.query, storeId: req.user.storeId };
    const metrics = await reportService.getScannerMetrics(options);
    res.json(success(metrics));
  } catch (err) {
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

module.exports = {
  getSalesReport,
  getTopProducts,
  getInventoryReport,
  getDailySalesSummary,
  getCashFlowReport,
  getScannerMetrics,
};
