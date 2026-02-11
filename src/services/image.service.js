const sharp = require("sharp");
const {
  uploadImage: uploadToCloudinary,
  deleteImage: deleteFromCloudinary,
} = require("../config/cloudinary");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Process and compress image
const processImage = async (imagePath, options = {}) => {
  const {
    width = 800,
    height = 800,
    quality = 85,
    format = "jpeg",
    fit = "inside",
  } = options;

  const processedPath = `/tmp/processed_${uuidv4()}.${format}`;

  try {
    let pipeline = sharp(imagePath)
      .resize(width, height, { fit, withoutEnlargement: true })
      .jpeg({ quality, progressive: true });

    if (format === "webp") {
      pipeline = sharp(imagePath)
        .resize(width, height, { fit, withoutEnlargement: true })
        .webp({ quality });
    }

    await pipeline.toFile(processedPath);

    return {
      path: processedPath,
      width,
      height,
      format,
    };
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

// Process base64 image
const processBase64Image = async (base64Data, options = {}) => {
  const tempInput = `/tmp/input_${uuidv4()}.jpg`;
  const tempOutput = `/tmp/output_${uuidv4()}.webp`;

  try {
    // Write base64 to temp file
    const buffer = base64Data.startsWith("data:image")
      ? Buffer.from(base64Data.split(",")[1], "base64")
      : Buffer.from(base64Data, "base64");

    await sharp(buffer).jpeg({ quality: 90 }).toFile(tempInput);

    // Process image
    const { width, height } = await sharp(tempInput)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(tempOutput)
      .metadata();

    // Read processed image
    const processedBuffer = fs.readFileSync(tempOutput);
    const base64Processed = processedBuffer.toString("base64");
    const dataUrl = `data:image/webp;base64,${base64Processed}`;

    // Clean up temp files
    fs.unlinkSync(tempInput);
    fs.unlinkSync(tempOutput);

    return {
      dataUrl,
      width,
      height,
      size: processedBuffer.length,
    };
  } catch (error) {
    console.error("Error processing base64 image:", error);
    throw error;
  }
};

// Generate thumbnail
const generateThumbnail = async (imagePath, size = 200) => {
  const thumbnailPath = `/tmp/thumb_${uuidv4()}.webp`;

  try {
    await sharp(imagePath)
      .resize(size, size, { fit: "cover" })
      .webp({ quality: 70 })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    throw error;
  }
};

// Upload image to cloud
const uploadImage = async (imagePath, folder = "products") => {
  try {
    const result = await uploadToCloudinary(imagePath, folder);
    return result;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Delete image from cloud
const deleteImage = async (publicId) => {
  try {
    await deleteFromCloudinary(publicId);
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

// Auto-rotate image based on EXIF orientation
const autoRotateImage = async (imagePath) => {
  try {
    const rotatedPath = `/tmp/rotated_${uuidv4()}.jpg`;

    await sharp(imagePath).rotate().toFile(rotatedPath);

    return rotatedPath;
  } catch (error) {
    console.error("Error auto-rotating image:", error);
    throw error;
  }
};

// Detect and crop barcode region
const detectBarcodeRegion = async (imagePath) => {
  // This is a placeholder - in production, you might use ML to detect barcode regions
  // For now, return the original image path
  return imagePath;
};

module.exports = {
  processImage,
  processBase64Image,
  generateThumbnail,
  uploadImage,
  deleteImage,
  autoRotateImage,
  detectBarcodeRegion,
};
