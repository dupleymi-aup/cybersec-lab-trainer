// Time constants
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
export const MS_PER_WEEK = 7 * MS_PER_DAY;

// Rate limiting
export const RATE_WINDOW_1_MIN = 60_000;

// URL defaults
export const DEFAULT_APP_URL = 'http://localhost:3000';

// Percentage helpers
export const PERCENT_SCALE = 100;
export const PERCENT_ROUNDING_FACTOR = 10000; // For Math.round(value * 10000) / 100
