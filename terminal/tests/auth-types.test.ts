import { describe, it, expect } from 'vitest';
import {
  hasRole,
  hasPermission,
  getRoleLabel,
  getRoleDescription,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
} from '@/lib/auth-types';
import type { UserRole } from '@/lib/auth-types';

describe('hasRole', () => {
  it('should return false for null/undefined user role', () => {
    expect(hasRole(null, 'student')).toBe(false);
    expect(hasRole(undefined, 'student')).toBe(false);
  });

  it('should return true when user has equal role', () => {
    expect(hasRole('student', 'student')).toBe(true);
    expect(hasRole('teacher', 'teacher')).toBe(true);
    expect(hasRole('admin', 'admin')).toBe(true);
  });

  it('should return true when user has higher role than required', () => {
    expect(hasRole('teacher', 'student')).toBe(true);
    expect(hasRole('admin', 'student')).toBe(true);
    expect(hasRole('admin', 'teacher')).toBe(true);
  });

  it('should return false when user has lower role than required', () => {
    expect(hasRole('student', 'teacher')).toBe(false);
    expect(hasRole('student', 'admin')).toBe(false);
    expect(hasRole('teacher', 'admin')).toBe(false);
  });
});

describe('hasPermission', () => {
  it('should return false for null/undefined user role', () => {
    expect(hasPermission(null, 'view_modules')).toBe(false);
    expect(hasPermission(undefined, 'view_modules')).toBe(false);
  });

  it('should return true for permissions assigned to the role', () => {
    expect(hasPermission('student', 'view_modules')).toBe(true);
    expect(hasPermission('teacher', 'create_assignments')).toBe(true);
    expect(hasPermission('admin', 'manage_users')).toBe(true);
  });

  it('should return false for permissions not assigned to the role', () => {
    expect(hasPermission('student', 'manage_users')).toBe(false);
    expect(hasPermission('teacher', 'impersonate')).toBe(false);
  });

  it('should allow admin to have all permissions', () => {
    for (const perm of ROLE_PERMISSIONS.admin) {
      expect(hasPermission('admin', perm)).toBe(true);
    }
  });
});

describe('getRoleLabel', () => {
  it('should return correct Russian labels', () => {
    expect(getRoleLabel('student')).toBe('Студент');
    expect(getRoleLabel('teacher')).toBe('Преподаватель');
    expect(getRoleLabel('admin')).toBe('Администратор');
  });

  it('should return the role string itself for unknown roles', () => {
    expect(getRoleLabel('unknown' as UserRole)).toBe('unknown');
  });
});

describe('getRoleDescription', () => {
  it('should return non-empty descriptions for all roles', () => {
    expect(getRoleDescription('student')).toBeTruthy();
    expect(getRoleDescription('teacher')).toBeTruthy();
    expect(getRoleDescription('admin')).toBeTruthy();
  });

  it('should return empty string for unknown roles', () => {
    expect(getRoleDescription('unknown' as UserRole)).toBe('');
  });

  it('should give admin the most permissions description', () => {
    const admin = getRoleDescription('admin');
    const teacher = getRoleDescription('teacher');
    expect(admin.length).toBeGreaterThan(teacher.length);
  });
});
