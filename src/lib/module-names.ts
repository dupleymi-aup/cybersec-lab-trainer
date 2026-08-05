// Server-safe module name lookup (can be imported by API routes)
const MODULE_NAME_MAP: Record<string, string> = {
  owasp: 'OWASP Top 10',
  'sql-injection': 'SQL Injection',
  xss: 'XSS Attacks',
  csrf: 'CSRF Attacks',
  auth: 'Authentication',
  'secure-coding': 'Secure Coding',
  tools: 'Security Tools',
  'security-headers': 'Security Headers',
  idor: 'IDOR Attacks',
  ssrf: 'SSRF Attacks',
  'api-security': 'API Security',
  'phishing-analyzer': 'Phishing Analyzer',
};

/** Shorter display names for analytics dashboards */
export const MODULE_SHORT_NAMES: Record<string, string> = {
  owasp: 'OWASP Top 10',
  'sql-injection': 'SQL Injection',
  xss: 'XSS',
  csrf: 'CSRF',
  auth: 'Authentication',
  'secure-coding': 'Secure Coding',
  tools: 'Tools',
  'security-headers': 'Security Headers',
  idor: 'IDOR',
  ssrf: 'SSRF',
};

/** Quiz category display names for analytics */
export const CATEGORY_NAMES: Record<string, string> = {
  sql: 'SQL Injection',
  xss: 'XSS',
  csrf: 'CSRF',
  auth: 'Authentication',
  general: 'General',
  owasp: 'OWASP',
  coding: 'Secure Coding',
  network: 'Network Security',
  social: 'Social Engineering',
};

export function getModuleName(moduleId: string): string {
  return MODULE_NAME_MAP[moduleId] || moduleId;
}
