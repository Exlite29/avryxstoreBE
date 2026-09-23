const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

class ImageProcessor {
  constructor() {
    this.defaultOptions = {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 85,
      format: "jpeg",
    };
  }

  // Process image with options
  async process(input, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    const pipeline = sharp(input);

    // Resize if needed
    if (opts.maxWidth || opts.maxHeight) {
      pipeline.resize(opts.maxWidth, opts.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert format
    if (opts.format === "webp") {
      pipeline.webp({ quality: opts.quality });
    } else if (opts.format === "png") {
      pipeline.png({ compressionLevel: 9 });
    } else {
      pipeline.jpeg({ quality: opts.quality, progressive: true });
    }

    const outputPath = this.getTempPath(opts.format);
    await pipeline.toFile(outputPath);

    return outputPath;
  }

  // Compress image
  async compress(input, quality = 80) {
    const outputPath = this.getTempPath("jpeg");
    await sharp(input).jpeg({ quality, progressive: true }).toFile(outputPath);
    return outputPath;
  }

  // Resize image
  async resize(input, width, height, fit = "fill") {
    const outputPath = this.getTempPath("jpeg");
    await sharp(input)
      .resize(width, height, { fit })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    return outputPath;
  }

  // Crop image
  async crop(input, { left, top, width, height }) {
    const outputPath = this.getTempPath("jpeg");
    await sharp(input)
      .extract({ left, top, width, height })
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    return outputPath;
  }

  // Rotate image
  async rotate(input, angle = 0) {
    const outputPath = this.getTempPath("jpeg");
    await sharp(input).rotate(angle).jpeg({ quality: 90 }).toFile(outputPath);
    return outputPath;
  }

  // Auto-rotate based on EXIF orientation
  async autoRotate(input) {
    const outputPath = this.getTempPath("jpeg");
    await sharp(input).rotate().jpeg({ quality: 90 }).toFile(outputPath);
    return outputPath;
  }

  // Convert to grayscale
  async grayscale(input) {
    const outputPath = this.getTempPath("jpeg");
    await sharp(input).grayscale().jpeg({ quality: 90 }).toFile(outputPath);
    return outputPath;
  }

  // Increase contrast
  async contrast(input, factor = 1.5) {
    const outputPath = this.getTempPath("jpeg");
    await sharp(input)
      .linear(factor, -(factor - 1) * 128)
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    return outputPath;
  }

  // Sharpen image
  async sharpen(input, sigma = 1) {
    const outputPath = this.getTempPath("jpeg");
    await sharp(input).sharpen(sigma).jpeg({ quality: 90 }).toFile(outputPath);
    return outputPath;
  }

  // Enhance barcode readability
  async enhanceForBarcode(input) {
    let pipeline = sharp(input);

    // Auto-rotate
    pipeline = pipeline.rotate();

    // Increase contrast
    pipeline = pipeline.linear(1.5, -50);

    // Convert to grayscale
    pipeline = pipeline.grayscale();

    // Slight sharpening
    pipeline = pipeline.sharpen(1);

    // Resize to reasonable dimensions while maintaining aspect ratio
    pipeline = pipeline.resize(1200, null, {
      fit: "inside",
      withoutEnlargement: true,
    });

    const outputPath = this.getTempPath("jpeg");
    await pipeline.jpeg({ quality: 95 }).toFile(outputPath);
    return outputPath;
  }

  // Get image metadata
  async getMetadata(input) {
    const metadata = await sharp(input).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      space: metadata.space,
      channels: metadata.channels,
      depth: metadata.depth,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  }

  // Check if image is valid
  async isValidImage(input) {
    try {
      const metadata = await this.getMetadata(input);
      return metadata.format !== undefined;
    } catch {
      return false;
    }
  }

  // Generate thumbnail
  async generateThumbnail(input, size = 200) {
    const outputPath = this.getTempPath("webp");
    await sharp(input)
      .resize(size, size, { fit: "cover" })
      .webp({ quality: 70 })
      .toFile(outputPath);
    return outputPath;
  }

  // Convert base64 to buffer
  base64ToBuffer(base64Data) {
    const matches = base64Data.match(
      /^data:image\/([A-Za-z-+\/]+);base64,(.+)$/,
    );
    if (!matches) {
      throw new Error("Invalid base64 image data");
    }
    const type = matches[1];
    const data = Buffer.from(matches[2], "base64");
    return { buffer: data, type };
  }

  // Convert buffer to base64
  bufferToBase64(buffer, format = "image/jpeg") {
    return `data:${format};base64,${buffer.toString("base64")}`;
  }

  // Get temp file path
  getTempPath(format = "jpeg") {
    const tempDir = path.join(__dirname, "..", "..", "uploads", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    return path.join(tempDir, `${uuidv4()}.${format}`);
  }

  // Clean up temp files
  cleanup(files) {
    if (!Array.isArray(files)) {
      files = [files];
    }
    files.forEach((file) => {
      if (file && fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
  }
}

// Singleton instance
const processor = new ImageProcessor();

module.exports = {
  ImageProcessor,
  processor,
};
