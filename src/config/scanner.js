const { BrowserMultiFormatReader, BarcodeFormat } = require("@zxing/library");

let barcodeReader = null;

const initializeScanner = () => {
  if (!barcodeReader) {
    barcodeReader = new BrowserMultiFormatReader();
  }
  return barcodeReader;
};

const decodeBarcodeFromImage = async (imagePath) => {
  try {
    const reader = initializeScanner();
    const result = await reader.decodeFromImage(imagePath);
    return {
      text: result.getText(),
      format: result.getBarcodeFormat(),
      rawBytes: result.getRawBytes(),
    };
  } catch (error) {
    console.error("Barcode decoding error:", error);
    return null;
  }
};

const decodeBarcodeFromBuffer = async (buffer) => {
  try {
    const reader = initializeScanner();
    const result = await reader.decodeFromImageBuffer(buffer);
    return {
      text: result.getText(),
      format: result.getBarcodeFormat(),
      rawBytes: result.getRawBytes(),
    };
  } catch (error) {
    console.error("Barcode decoding from buffer error:", error);
    return null;
  }
};

// List of supported barcode formats
const supportedFormats = [
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

// Validate barcode format
const isValidBarcode = (barcode) => {
  // Handle null/undefined/empty
  if (!barcode || typeof barcode !== "string") {
    return false;
  }

  const cleaned = barcode.trim();

  if (cleaned.length === 0) {
    return false;
  }

  // UPC-A, EAN-13: 12 or 13 digits
  const upcPattern = /^\d{12,13}$/;
  // EAN-8: 8 digits
  const ean8Pattern = /^\d{8}$/;
  // Code 39: Only uppercase letters, numbers, and limited special chars (- . $ / + % space)
  const code39Pattern = /^[A-Z0-9\-\.\$\/\+\%\s]+$/i;
  // Code 128: All ASCII (but must have at least one letter or number)
  const code128Pattern = /^[\x00-\x7F]+$/;

  // Special characters only test (for validation purposes)
  const specialCharsOnly = /^[\-\.\$\/\+\%\s]+$/;

  // Reject if only special characters
  if (specialCharsOnly.test(cleaned)) {
    return false;
  }

  return (
    upcPattern.test(cleaned) ||
    ean8Pattern.test(cleaned) ||
    code39Pattern.test(cleaned) ||
    code128Pattern.test(cleaned)
  );
};

// Calculate checksum for EAN-13
const validateEAN13Checksum = (barcode) => {
  if (
    !barcode ||
    typeof barcode !== "string" ||
    barcode.length !== 13 ||
    !/^\d+$/.test(barcode)
  ) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === parseInt(barcode[12]);
};

// Calculate checksum for EAN-8
const validateEAN8Checksum = (barcode) => {
  if (
    !barcode ||
    typeof barcode !== "string" ||
    barcode.length !== 8 ||
    !/^\d+$/.test(barcode)
  ) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === parseInt(barcode[7]);
};

// Calculate checksum for UPC-A
const validateUPCAChecksum = (barcode) => {
  if (
    !barcode ||
    typeof barcode !== "string" ||
    barcode.length !== 12 ||
    !/^\d+$/.test(barcode)
  ) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === parseInt(barcode[11]);
};

module.exports = {
  initializeScanner,
  decodeBarcodeFromImage,
  decodeBarcodeFromBuffer,
  supportedFormats,
  isValidBarcode,
  validateEAN13Checksum,
  validateEAN8Checksum,
  validateUPCAChecksum,
};
