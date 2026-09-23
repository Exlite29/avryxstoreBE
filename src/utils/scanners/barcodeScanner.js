const { BrowserMultiFormatReader, BarcodeFormat } = require("@zxing/library");

class BarcodeScanner {
  constructor() {
    this.reader = null;
    this.supportedFormats = [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.EAN_8,
      BarcodeFormat.EAN_13,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODE_128,
      BarcodeFormat.ITF,
      BarcodeFormat.DATA_MATRIX,
    ];
  }

  // Initialize the scanner
  async initialize() {
    if (!this.reader) {
      this.reader = new BrowserMultiFormatReader();
    }
    return this.reader;
  }

  // Decode barcode from image path
  async decodeFromImage(imagePath) {
    try {
      await this.initialize();
      const result = await this.reader.decodeFromImage(imagePath);
      return this.formatResult(result);
    } catch (error) {
      console.error("Barcode decode from image error:", error);
      return null;
    }
  }

  // Decode barcode from image buffer
  async decodeFromBuffer(buffer) {
    try {
      await this.initialize();
      const result = await this.reader.decodeFromImageBuffer(buffer);
      return this.formatResult(result);
    } catch (error) {
      console.error("Barcode decode from buffer error:", error);
      return null;
    }
  }

  // Decode barcode from image URL
  async decodeFromURL(url) {
    try {
      await this.initialize();
      const result = await this.reader.decodeFromImageUrl(url);
      return this.formatResult(result);
    } catch (error) {
      console.error("Barcode decode from URL error:", error);
      return null;
    }
  }

  // Decode multiple barcodes from single image
  async decodeMultiple(imagePath) {
    try {
      await this.initialize();
      const results = await this.reader.decodeFromMultipleImages(imagePath);
      return results.map((result) => this.formatResult(result));
    } catch (error) {
      console.error("Multiple barcode decode error:", error);
      return [];
    }
  }

  // Format the result
  formatResult(result) {
    return {
      text: result.getText(),
      format: result.getBarcodeFormat(),
      formatName: this.getFormatName(result.getBarcodeFormat()),
      rawBytes: result.getRawBytes(),
      timestamp: new Date().toISOString(),
    };
  }

  // Get format name
  getFormatName(format) {
    const formatNames = {
      [BarcodeFormat.QR_CODE]: "QR_CODE",
      [BarcodeFormat.UPC_A]: "UPC_A",
      [BarcodeFormat.UPC_E]: "UPC_E",
      [BarcodeFormat.EAN_8]: "EAN_8",
      [BarcodeFormat.EAN_13]: "EAN_13",
      [BarcodeFormat.CODE_39]: "CODE_39",
      [BarcodeFormat.CODE_93]: "CODE_93",
      [BarcodeFormat.CODE_128]: "CODE_128",
      [BarcodeFormat.ITF]: "ITF",
      [BarcodeFormat.DATA_MATRIX]: "DATA_MATRIX",
    };
    return formatNames[format] || "UNKNOWN";
  }

  // Check if barcode is valid
  validateBarcode(barcode) {
    if (!barcode || typeof barcode !== "string") {
      return { valid: false, error: "Invalid barcode input" };
    }

    const cleaned = barcode.replace(/[\s\-]/g, "");

    // Check length based on format
    if (/^\d{12,13}$/.test(cleaned)) {
      return { valid: true, type: cleaned.length === 13 ? "EAN-13" : "UPC-A" };
    }
    if (/^\d{8}$/.test(cleaned)) {
      return { valid: true, type: "EAN-8" };
    }
    if (/^\d{6,7}$/.test(cleaned)) {
      return { valid: true, type: "UPC-E" };
    }
    if (/^[A-Z0-9\-\.\$\/\+\%\s]+$/i.test(cleaned) && cleaned.length <= 43) {
      return { valid: true, type: "CODE_39" };
    }
    if (/^[\x00-\x7F]+$/.test(cleaned)) {
      return { valid: true, type: "CODE_128" };
    }

    return { valid: false, error: "Unknown barcode format" };
  }

  // Calculate EAN checksum
  calculateChecksum(barcode, type = "EAN-13") {
    if (!/^\d+$/.test(barcode)) {
      return null;
    }

    let sum = 0;
    const weights =
      type === "EAN-13"
        ? [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3]
        : [3, 1, 3, 1, 3, 1, 3];

    for (let i = 0; i < barcode.length - 1; i++) {
      sum += parseInt(barcode[i]) * weights[i % weights.length];
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit;
  }

  // Verify checksum
  verifyChecksum(barcode, type = "EAN-13") {
    if (barcode.length !== (type === "EAN-13" ? 13 : 8)) {
      return false;
    }
    const expectedCheck = this.calculateChecksum(barcode, type);
    return expectedCheck === parseInt(barcode[barcode.length - 1]);
  }

  // Destroy the scanner
  destroy() {
    if (this.reader) {
      this.reader.reset();
      this.reader = null;
    }
  }
}

// Singleton instance
let scannerInstance = null;

const getScanner = () => {
  if (!scannerInstance) {
    scannerInstance = new BarcodeScanner();
  }
  return scannerInstance;
};

module.exports = {
  BarcodeScanner,
  getScanner,
};
