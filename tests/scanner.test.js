// Scanner Service Tests
const {
  isValidBarcode,
  validateEAN13Checksum,
  validateEAN8Checksum,
  validateUPCAChecksum,
} = require("../src/config/scanner");

describe("Barcode Validation", () => {
  describe("isValidBarcode", () => {
    test("should validate EAN-13 barcodes", () => {
      const validEAN13 = "4801234567890";
      expect(isValidBarcode(validEAN13)).toBe(true);
    });

    test("should validate EAN-8 barcodes", () => {
      const validEAN8 = "48012345";
      expect(isValidBarcode(validEAN8)).toBe(true);
    });

    test("should validate UPC-A barcodes", () => {
      const validUPCA = "012345678901";
      expect(isValidBarcode(validUPCA)).toBe(true);
    });

    test("should validate Code 39 barcodes", () => {
      const validCode39 = "ABC123";
      expect(isValidBarcode(validCode39)).toBe(true);
    });

    test("should validate Code 39 barcodes with dashes", () => {
      const validCode39 = "ABC-123";
      expect(isValidBarcode(validCode39)).toBe(true);
    });

    test("should reject empty strings", () => {
      expect(isValidBarcode("")).toBe(false);
    });

    test("should reject null or undefined", () => {
      expect(isValidBarcode(null)).toBe(false);
      expect(isValidBarcode(undefined)).toBe(false);
    });

    test("should reject strings with only special characters", () => {
      // These characters are valid in Code 39 but should be rejected alone
      expect(isValidBarcode("-.")).toBe(false);
      expect(isValidBarcode("$/%")).toBe(false);
    });
  });

  describe("validateEAN13Checksum", () => {
    test("should validate correct EAN-13 with valid checksum", () => {
      // A valid EAN-13 barcode (4801234567890 is 12 digits, needs check digit)
      // Let's use a known valid one: 5901234123457
      expect(validateEAN13Checksum("5901234123457")).toBe(true);
    });

    test("should reject EAN-13 with invalid checksum", () => {
      expect(validateEAN13Checksum("4801234567890")).toBe(false);
    });

    test("should reject non-numeric EAN-13", () => {
      expect(validateEAN13Checksum("ABCDEFGHIJKLM")).toBe(false);
    });
  });
});

describe("Barcode Service", () => {
  const { generateBarcodeImage } = require("../src/services/barcode.service");

  describe("generateBarcodeImage", () => {
    test("should generate barcode image for valid barcode", async () => {
      const result = await generateBarcodeImage({
        barcode: "12345678",
        scale: 3,
        height: 10,
      });
      expect(result).toHaveProperty("format", "png");
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("dataUrl");
    });

    test("should throw error for invalid barcode", async () => {
      await expect(
        generateBarcodeImage({ barcode: "", scale: 3, height: 10 }),
      ).rejects.toThrow();
    });
  });
});

describe("Scanner API Response Format", () => {
  test("should return correct success response structure", () => {
    const { success, scanned } = require("../src/utils/apiResponse");

    const result = success({ id: "123" }, "Test message");
    expect(result).toEqual({
      success: true,
      message: "Test message",
      data: { id: "123" },
    });
  });

  test("should return correct scanned response with metadata", () => {
    const { scanned } = require("../src/utils/apiResponse");

    const result = scanned(
      { product: { id: "123", name: "Test Product" } },
      { itemsScanned: 5, itemsRecognized: 4 },
    );

    expect(result.success).toBe(true);
    expect(result.data.product.id).toBe("123");
    expect(result.metadata.itemsScanned).toBe(5);
    expect(result.metadata).toHaveProperty("scanTime");
  });
});
