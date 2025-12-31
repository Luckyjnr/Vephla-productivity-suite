// Global test setup
process.env.NODE_ENV = 'test';

// Suppress console.log during tests unless explicitly needed
if (!process.env.VERBOSE_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Set test timeout
jest.setTimeout(30000);