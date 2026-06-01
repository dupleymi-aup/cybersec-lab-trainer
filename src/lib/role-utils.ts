import type { UserRole } from './auth-types';

const VALID_ROLES: ReadonlySet<UserRole> = new Set(['student', 'teacher', 'admin']);

/**
 * Safely validate a role string. Returns the role if valid, or 'student' as fallback.
 * Replaces unsafe pattern: `value as UserRole` which bypasses type checking.
 */
export function validateRole(value: unknown): UserRole {
  if (typeof value === 'string' && VALID_ROLES.has(value as UserRole)) {
    return value as UserRole;
  }
  return 'student';
}

/**
 * Type guard to check if a value is a valid UserRole.
 */
export function isValidRole(value: unknown): value is UserRole {
  return typeof value === 'string' && VALID_ROLES.has(value as UserRole);
}
