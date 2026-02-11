require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Import configuration
const { initializeDatabase } = require("./config/database");
const logger = require("./utils/logger");

// Import routes
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/products.routes");
const scannerRoutes = require("./routes/scanner.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const salesRoutes = require("./routes/sales.routes");
const reportsRoutes = require("./routes/reports.routes");

// Import middleware
const { apiRateLimiter } = require("./middleware/rateLimiter");
const { error } = require("./utils/apiResponse");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API info endpoint
app.get("/api/v1", (req, res) => {
  res.json({
    name: "Sari-Sari Store Management API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/v1/auth",
      products: "/api/v1/products",
      scanner: "/api/v1/scanner",
      inventory: "/api/v1/inventory",
      sales: "/api/v1/sales",
      reports: "/api/v1/reports",
    },
  });
});

// Rate limiting
app.use("/api", apiRateLimiter);

// Mount routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/scanner", scannerRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/sales", salesRoutes);
app.use("/api/v1/reports", reportsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json(error("Endpoint not found"));
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);

  res
    .status(err.status || 500)
    .json(
      error(
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
      ),
    );
});

// Start server
const startServer = async () => {
  try {
    // Initialize database
    logger.info("Initializing database...");
    await initializeDatabase();
    logger.info("Database initialized successfully");

    // Start listening
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API documentation: http://localhost:${PORT}/api/v1`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

startServer();

module.exports = app;
