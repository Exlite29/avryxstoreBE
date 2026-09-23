// OCR Helper for price tag recognition
// This is a placeholder - in production, integrate with Tesseract.js or cloud OCR APIs

class OCRHelper {
  constructor() {
    this.supportedLanguages = ["eng", "fil"];
    this.defaultLanguage = "eng";
  }

  // Recognize text from image
  async recognizeText(imagePath, options = {}) {
    // Placeholder for OCR implementation
    // In production, use Tesseract.js:
    // const Tesseract = require('tesseract.js');
    // const { data: { text } } = await Tesseract.recognize(imagePath, options.language || this.defaultLanguage);

    console.log("OCR processing for:", imagePath);

    return {
      text: "",
      confidence: 0,
      words: [],
    };
  }

  // Extract price from OCR text
  extractPrice(text) {
    // Look for Philippine Peso patterns
    const pesoPatterns = [
      /₱\s*([\d,]+\.?\d*)/g,
      /PHP\s*([\d,]+\.?\d*)/gi,
      / pesos?\s*([\d,]+\.?\d*)/gi,
      /([\d,]+\.?\d*)\s*pesos?/gi,
    ];

    let prices = [];

    for (const pattern of pesoPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const price = parseFloat(match[1].replace(/,/g, ""));
          if (price > 0 && price < 100000) {
            // Reasonable price range
            prices.push(price);
          }
        }
      }
    }

    // If no peso pattern found, look for generic decimal numbers
    if (prices.length === 0) {
      const genericPatterns = /([\d,]+\.\d{2})/g;
      const matches = text.matchAll(genericPatterns);
      for (const match of matches) {
        const price = parseFloat(match[1].replace(/,/g, ""));
        if (price > 0 && price < 10000) {
          prices.push(price);
        }
      }
    }

    return prices.length > 0 ? Math.max(...prices) : null;
  }

  // Extract barcode from OCR text
  extractBarcode(text) {
    const patterns = [
      /\b(\d{12,13})\b/g, // EAN/UPC
      /\b(\d{8})\b/g, // EAN-8
      /\b([A-Z0-9]{6,})\b/g, // Generic alphanumeric
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length >= 6) {
          return match[1];
        }
      }
    }

    return null;
  }

  // Extract product name from OCR text
  extractProductName(text) {
    // Remove common price/barcode patterns
    const cleaned = text
      .replace(/₱[\s\d,.]+/g, "")
      .replace(/PHP[\s\d,.]+/g, "")
      .replace(/\d+\s*pesos?/gi, "")
      .replace(/\d{6,}/g, "")
      .replace(/[^\w\s\-'.&]/g, "")
      .trim();

    // Take first line or first few words as product name
    const lines = cleaned.split("\n").filter((line) => line.trim().length > 3);

    if (lines.length > 0) {
      return lines[0].trim().substring(0, 100);
    }

    return cleaned.substring(0, 100) || null;
  }

  // Process price tag image
  async processPriceTag(imagePath) {
    const ocrResult = await this.recognizeText(imagePath);
    const text = ocrResult.text;

    return {
      rawText: text,
      price: this.extractPrice(text),
      barcode: this.extractBarcode(text),
      productName: this.extractProductName(text),
      confidence: ocrResult.confidence,
    };
  }

  // Batch process images
  async batchProcess(imagePaths, options = {}) {
    const results = [];

    for (const imagePath of imagePaths) {
      try {
        const result = await this.processPriceTag(imagePath);
        results.push({ imagePath, ...result });
      } catch (error) {
        results.push({ imagePath, error: error.message });
      }
    }

    return results;
  }

  // Clean up OCR text
  cleanText(text) {
    return text.replace(/\n+/g, " ").replace(/\s+/g, " ").trim();
  }
}

// Singleton instance
const ocrHelper = new OCRHelper();

module.exports = {
  OCRHelper,
  ocrHelper,
};
