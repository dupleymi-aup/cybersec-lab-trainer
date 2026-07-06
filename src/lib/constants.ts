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

// Brand
export const APP_NAME = 'CyberSec Lab';

// Chart palette — used across all recharts analytics components
export const CHART_COLORS = {
  primary: '#6366f1', // indigo-500 — main data series
  success: '#10b981', // emerald-500 — positive / completed
  warning: '#f59e0b', // amber-500 — caution / medium
  danger: '#f43f5e', // rose-500 — alerts / risk
  info: '#3b82f6', // blue-500 — neutral data
  accent: '#8b5cf6', // violet-500 — secondary series
  muted: '#94a3b8', // slate-400 — reference / comparison
  grid: '#e2e8f0', // slate-200 — chart grid lines
} as const;
