import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { config } from 'dotenv';
import path from 'path';

// Load .env file for tests
config({ path: path.resolve(__dirname, '../.env') });

// Ensure TOKEN_SECRET is set for tests
if (!process.env.TOKEN_SECRET) {
  process.env.TOKEN_SECRET = 'test-secret-for-unit-tests-min-32-chars';
}

// Mock crypto for Node.js environment
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = require('crypto').webcrypto;
}

// Cleanup after each test
afterEach(() => {
  cleanup();
});
