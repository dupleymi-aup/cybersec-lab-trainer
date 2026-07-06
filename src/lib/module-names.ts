// Server-safe module name lookup (can be imported by API routes)
export const MODULE_NAME_MAP: Record<string, string> = {
  owasp: 'OWASP Top 10',
  'sql-injection': 'SQL-инъекции',
  xss: 'XSS-атаки',
  csrf: 'CSRF-атаки',
  auth: 'Аутентификация',
  'secure-coding': 'Безопасное кодирование',
  tools: 'Инструменты безопасности',
  'security-headers': 'Security Headers',
  idor: 'IDOR-атаки',
  ssrf: 'SSRF-атаки',
  'api-security': 'Безопасность API',
  'phishing-analyzer': 'Анализатор фишинговых писем',
};

export function getModuleName(moduleId: string): string {
  return MODULE_NAME_MAP[moduleId] || moduleId;
}
