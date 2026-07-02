/**
 * Centralized module identifiers and metadata used across the application.
 * Previously duplicated in multiple analytics route files.
 */

export const MODULE_IDS = [
  "owasp",
  "sql-injection",
  "xss",
  "csrf",
  "auth",
  "secure-coding",
  "tools",
  "security-headers",
  "idor",
  "ssrf",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export const MODULE_NAMES: Record<ModuleId, string> = {
  owasp: "OWASP Top 10",
  "sql-injection": "SQL Injection",
  xss: "Cross-Site Scripting (XSS)",
  csrf: "Cross-Site Request Forgery (CSRF)",
  auth: "Authentication & Authorization",
  "secure-coding": "Secure Coding Practices",
  tools: "Security Testing Tools",
  "security-headers": "HTTP Security Headers",
  idor: "Insecure Direct Object Reference (IDOR)",
  ssrf: "Server-Side Request Forgery (SSRF)",
};

export const TOTAL_MODULES = MODULE_IDS.length;

/**
 * Subset of modules used in data-quality analytics.
 */
export const CORE_MODULE_IDS = MODULE_IDS.slice(0, 8) as readonly ModuleId[];
