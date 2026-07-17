// Server-safe module name lookup (can be imported by API routes)
export const MODULE_NAME_MAP: Record<string, string> = {
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

export function getModuleName(moduleId: string): string {
  return MODULE_NAME_MAP[moduleId] || moduleId;
}
