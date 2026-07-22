import { describe, it, expect } from 'vitest';
import {
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  hasRole,
  hasPermission,
  getRoleLabel,
  getRoleDescription,
} from '@/lib/auth-types';

describe('ROLE_HIERARCHY', () => {
  it('defines correct hierarchy order', () => {
    expect(ROLE_HIERARCHY.student).toBeLessThan(ROLE_HIERARCHY.teacher);
    expect(ROLE_HIERARCHY.teacher).toBeLessThan(ROLE_HIERARCHY.admin);
  });

  it('has all three roles', () => {
    expect(ROLE_HIERARCHY).toHaveProperty('student');
    expect(ROLE_HIERARCHY).toHaveProperty('teacher');
    expect(ROLE_HIERARCHY).toHaveProperty('admin');
  });
});

describe('ROLE_PERMISSIONS', () => {
  it('student has basic permissions', () => {
    expect(ROLE_PERMISSIONS.student).toContain('view_modules');
    expect(ROLE_PERMISSIONS.student).toContain('take_quizzes');
    expect(ROLE_PERMISSIONS.student).toContain('view_progress');
    expect(ROLE_PERMISSIONS.student).toContain('view_leaderboard');
  });

  it('student does not have admin permissions', () => {
    expect(ROLE_PERMISSIONS.student).not.toContain('manage_users');
    expect(ROLE_PERMISSIONS.student).not.toContain('change_roles');
  });

  it('teacher has student permissions plus teaching ones', () => {
    expect(ROLE_PERMISSIONS.teacher).toContain('create_assignments');
    expect(ROLE_PERMISSIONS.teacher).toContain('grade_submissions');
    expect(ROLE_PERMISSIONS.teacher).toContain('view_students_progress');
    expect(ROLE_PERMISSIONS.teacher).toContain('manage_deadlines');
    expect(ROLE_PERMISSIONS.teacher).toContain('view_analytics');
    expect(ROLE_PERMISSIONS.teacher).toContain('export_grades');
  });

  it('admin has all permissions', () => {
    expect(ROLE_PERMISSIONS.admin).toContain('manage_users');
    expect(ROLE_PERMISSIONS.admin).toContain('change_roles');
    expect(ROLE_PERMISSIONS.admin).toContain('block_users');
    expect(ROLE_PERMISSIONS.admin).toContain('view_audit_logs');
    expect(ROLE_PERMISSIONS.admin).toContain('impersonate');
    expect(ROLE_PERMISSIONS.admin).toContain('manage_announcements');
    expect(ROLE_PERMISSIONS.admin).toContain('system_settings');
  });

  it('admin includes all teacher permissions', () => {
    for (const perm of ROLE_PERMISSIONS.teacher) {
      expect(ROLE_PERMISSIONS.admin).toContain(perm);
    }
  });
});

describe('hasRole', () => {
  it('returns true when user role meets required role', () => {
    expect(hasRole('admin', 'teacher')).toBe(true);
    expect(hasRole('teacher', 'student')).toBe(true);
    expect(hasRole('admin', 'admin')).toBe(true);
    expect(hasRole('teacher', 'teacher')).toBe(true);
    expect(hasRole('student', 'student')).toBe(true);
  });

  it('returns false when user role is below required role', () => {
    expect(hasRole('student', 'teacher')).toBe(false);
    expect(hasRole('student', 'admin')).toBe(false);
    expect(hasRole('teacher', 'admin')).toBe(false);
  });

  it('returns false for null role', () => {
    expect(hasRole(null, 'student')).toBe(false);
  });

  it('returns false for undefined role', () => {
    expect(hasRole(undefined, 'student')).toBe(false);
  });
});

describe('hasPermission', () => {
  it('returns true for student with view_modules permission', () => {
    expect(hasPermission('student', 'view_modules')).toBe(true);
  });

  it('returns false for student with manage_users permission', () => {
    expect(hasPermission('student', 'manage_users')).toBe(false);
  });

  it('returns true for teacher with grade_submissions permission', () => {
    expect(hasPermission('teacher', 'grade_submissions')).toBe(true);
  });

  it('returns false for teacher with manage_users permission', () => {
    expect(hasPermission('teacher', 'manage_users')).toBe(false);
  });

  it('returns true for admin with any permission', () => {
    expect(hasPermission('admin', 'manage_users')).toBe(true);
    expect(hasPermission('admin', 'system_settings')).toBe(true);
    expect(hasPermission('admin', 'impersonate')).toBe(true);
  });

  it('returns false for null role', () => {
    expect(hasPermission(null, 'view_modules')).toBe(false);
  });

  it('returns false for undefined role', () => {
    expect(hasPermission(undefined, 'view_modules')).toBe(false);
  });

  it('returns false for unknown permission', () => {
    expect(hasPermission('student', 'nonexistent_perm')).toBe(false);
  });
});

describe('getRoleLabel', () => {
  it('returns correct labels', () => {
    expect(getRoleLabel('student')).toBe('Student');
    expect(getRoleLabel('teacher')).toBe('Teacher');
    expect(getRoleLabel('admin')).toBe('Administrator');
  });
});

describe('getRoleDescription', () => {
  it('returns correct descriptions', () => {
    const studentDesc = getRoleDescription('student');
    expect(studentDesc).toContain('learning modules');
    expect(studentDesc).toContain('quizzes');

    const teacherDesc = getRoleDescription('teacher');
    expect(teacherDesc).toContain('assignments');
    expect(teacherDesc).toContain('grade');

    const adminDesc = getRoleDescription('admin');
    expect(adminDesc).toContain('Full access');
    expect(adminDesc).toContain('user management');
  });

  it('returns empty string for unknown role', () => {
    expect(getRoleDescription('unknown' as any)).toBe('');
  });
});
