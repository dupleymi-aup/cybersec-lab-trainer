/**
 * Structured logger for production use.
 * Sanitizes errors to prevent sensitive data leakage.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context: context ? sanitize(context) : undefined,
  };
}

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'passwordHash', 'token', 'authorization', 'cookie', 'secret'];
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  /* eslint-disable no-console -- intentional console use for structured logging */
  const entry = formatLog(level, message, context);
  if (process.env.NODE_ENV === 'production') {
    // Structured JSON output for production log aggregators
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](JSON.stringify(entry));
  } else {
    // Human-readable output for development
    const prefix = `[${entry.timestamp}] ${level.toUpperCase()}:`;
    if (context) {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](prefix, message, context);
    } else {
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](prefix, message);
    }
  }
  /* eslint-enable no-console */
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
};
