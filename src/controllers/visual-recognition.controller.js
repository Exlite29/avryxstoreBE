const visualRecognitionService = require("../services/visual-recognition.service");
const { success, error, created } = require("../utils/apiResponse");
const {
  SCANNER_ERRORS,
  SERVER_ERRORS,
  VALIDATION_ERRORS,
} = require("../utils/errorConstants");
const sharp = require("sharp");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;

/**
 * Recognize products from uploaded image (FREE method)
 * Uses keyword matching instead of paid AI add-ons
 */
const recognizeProduct = async (req, res) => {
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

    const { confidenceThreshold = 50 } = req.query;

    // Process and enhance image
    const tempPath = path.join("/tmp", `${uuidv4()}.jpg`);

    try {
      await sharp(req.file.path)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toFile(tempPath);

      const result = await visualRecognitionService.recognizeFromImage(
        tempPath,
        {
          confidenceThreshold: parseInt(confidenceThreshold),
        },
      );

      // Clean up temp file
      try {
        await fs.unlink(tempPath);
      } catch (e) {}

      if (result.success) {
        res.json(
          success(
            {
              ...result,
              note: "Recognition based on product database matching (free tier)",
            },
            "Visual recognition completed",
          ),
        );
      } else {
        res
          .status(400)
          .json(
            error(
              result.error || SCANNER_ERRORS.OCR_FAILED.message,
              SCANNER_ERRORS.OCR_FAILED.code,
            ),
          );
      }
    } catch (processError) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath);
      } catch (e) {}
      throw processError;
    }
  } catch (err) {
    console.error("Visual recognition error:", err);
    res
      .status(500)
      .json(
        error(
          err.message || SCANNER_ERRORS.IMAGE_PROCESSING_FAILED.message,
          SCANNER_ERRORS.IMAGE_PROCESSING_FAILED.code,
        ),
      );
  }
};

/**
 * Recognize products from base64 image (FREE method)
 */
const recognizeProductBase64 = async (req, res) => {
  try {
    const { image, confidenceThreshold = 50 } = req.body;

    if (!image) {
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

    const result = await visualRecognitionService.recognizeFromBase64(image, {
      confidenceThreshold,
    });

    if (result.success) {
      res.json(
        success(
          {
            ...result,
            note: "Basic image analysis (free tier)",
          },
          "Image analysis completed",
        ),
      );
    } else {
      res
        .status(400)
        .json(
          error(
            result.error || SCANNER_ERRORS.OCR_FAILED.message,
            SCANNER_ERRORS.OCR_FAILED.code,
          ),
        );
    }
  } catch (err) {
    console.error("Base64 visual recognition error:", err);
    res
      .status(500)
      .json(
        error(
          err.message || SCANNER_ERRORS.IMAGE_PROCESSING_FAILED.message,
          SCANNER_ERRORS.IMAGE_PROCESSING_FAILED.code,
        ),
      );
  }
};

/**
 * Train product recognition with product images
 */
const trainProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { imageUrls } = req.body;

    if (!productId || productId === "undefined") {
      return res
        .status(400)
        .json(
          error(
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.message,
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.code,
            { field: "productId" },
          ),
        );
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res
        .status(400)
        .json(
          error(
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.message,
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.code,
            { field: "imageUrls" },
          ),
        );
    }

    const result = await visualRecognitionService.trainProductRecognition(
      productId,
      imageUrls,
    );

    if (result.success) {
      res.json(
        success(
          result,
          "Product training completed - images stored for future recognition",
        ),
      );
    } else {
      res.status(400).json(error(result.error));
    }
  } catch (err) {
    console.error("Training error:", err);
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

/**
 * Get suggestions based on available categories
 */
const getSuggestions = async (req, res) => {
  try {
    const result = await visualRecognitionService.getSuggestions();

    res.json(
      success({
        ...result,
        note: "For better AI recognition, consider upgrading to Cloudinary's Google Vision add-on",
      }),
    );
  } catch (err) {
    console.error("Suggestions error:", err);
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

/**
 * Search products by category
 */
const searchByCategory = async (req, res) => {
  try {
    const { category } = req.query;

    if (!category) {
      return res
        .status(400)
        .json(
          error(
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.message,
            VALIDATION_ERRORS.MISSING_REQUIRED_FIELD.code,
            { field: "category" },
          ),
        );
    }

    const result = await visualRecognitionService.searchByCategory(category);

    res.json(success(result));
  } catch (err) {
    console.error("Category search error:", err);
    res.status(500).json(error(err.message, "SRV_001"));
  }
};

module.exports = {
  recognizeProduct,
  recognizeProductBase64,
  trainProduct,
  getSuggestions,
  searchByCategory,
};
