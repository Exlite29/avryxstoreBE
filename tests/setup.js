// Test setup file
// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key-for-testing-only";
process.env.ENCRYPTION_KEY = "test-32-byte-encryption-key!!!";

// Suppress console logs during tests unless debugging
if (process.env.DEBUG !== "true") {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    // Keep error and warn for important messages
    error: console.error,
    warn: console.warn,
  };
}

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Close any open handles
  await new Promise((resolve) => setTimeout(resolve, 500));
});
