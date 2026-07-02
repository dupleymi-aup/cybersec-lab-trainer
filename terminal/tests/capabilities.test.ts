import { describe, it, expect } from 'vitest';
import {
  hasCapability,
  hasCapabilities,
  hasAnyCapability,
  getScopeForCap,
  listCapabilities,
  getAllCapabilities,
  describeCapability,
  ROLE_CAPABILITIES,
} from '@/lib/capabilities';

describe('Capability System', () => {
  describe('hasCapability', () => {
    it('returns false for null/undefined role', () => {
      expect(hasCapability(null, 'modules:read')).toBe(false);
      expect(hasCapability(undefined, 'modules:read')).toBe(false);
    });

    it('student has student capabilities', () => {
      expect(hasCapability('student', 'modules:read')).toBe(true);
      expect(hasCapability('student', 'quizzes:take')).toBe(true);
      expect(hasCapability('student', 'progress:read_own')).toBe(true);
      expect(hasCapability('student', 'assignments:submit')).toBe(true);
      expect(hasCapability('student', 'leaderboard:read')).toBe(true);
    });

    it('student does NOT have teacher/admin capabilities', () => {
      expect(hasCapability('student', 'assignments:grade')).toBe(false);
      expect(hasCapability('student', 'assignments:create')).toBe(false);
      expect(hasCapability('student', 'users:read')).toBe(false);
      expect(hasCapability('student', 'users:delete')).toBe(false);
      expect(hasCapability('student', 'auth:impersonate')).toBe(false);
      expect(hasCapability('student', 'audit:read')).toBe(false);
      expect(hasCapability('student', 'system:settings')).toBe(false);
      expect(hasCapability('student', 'progress:read_all')).toBe(false);
    });

    it('teacher has teacher capabilities', () => {
      expect(hasCapability('teacher', 'modules:read')).toBe(true);
      expect(hasCapability('teacher', 'assignments:create')).toBe(true);
      expect(hasCapability('teacher', 'assignments:grade')).toBe(true);
      expect(hasCapability('teacher', 'deadlines:create')).toBe(true);
      expect(hasCapability('teacher', 'analytics:read_group')).toBe(true);
      expect(hasCapability('teacher', 'grades:export')).toBe(true);
      expect(hasCapability('teacher', 'progress:read_group')).toBe(true);
    });

    it('teacher does NOT have admin-only capabilities', () => {
      expect(hasCapability('teacher', 'users:delete')).toBe(false);
      expect(hasCapability('teacher', 'users:change_role')).toBe(false);
      expect(hasCapability('teacher', 'auth:impersonate')).toBe(false);
      expect(hasCapability('teacher', 'audit:read')).toBe(false);
      expect(hasCapability('teacher', 'system:settings')).toBe(false);
      expect(hasCapability('teacher', 'users:bulk_ops')).toBe(false);
    });

    it('admin has ALL capabilities', () => {
      expect(hasCapability('admin', 'modules:read')).toBe(true);
      expect(hasCapability('admin', 'quizzes:take')).toBe(true);
      expect(hasCapability('admin', 'users:delete')).toBe(true);
      expect(hasCapability('admin', 'users:change_role')).toBe(true);
      expect(hasCapability('admin', 'auth:impersonate')).toBe(true);
      expect(hasCapability('admin', 'audit:read')).toBe(true);
      expect(hasCapability('admin', 'system:settings')).toBe(true);
      expect(hasCapability('admin', 'users:bulk_ops')).toBe(true);
      expect(hasCapability('admin', 'lti:manage')).toBe(true);
      expect(hasCapability('admin', 'assignments:delete')).toBe(true);
    });

    it('compound capability: assignments:manage requires all 4 sub-caps', () => {
      // Teacher has create, edit, grade but NOT delete → manage should be false
      expect(hasCapability('teacher', 'assignments:manage')).toBe(false);
      expect(hasCapability('teacher', 'assignments:create')).toBe(true);
      expect(hasCapability('teacher', 'assignments:edit')).toBe(true);
      expect(hasCapability('teacher', 'assignments:grade')).toBe(true);
      expect(hasCapability('teacher', 'assignments:delete')).toBe(false);
    });

    it('admin has compound capabilities (has all sub-caps)', () => {
      expect(hasCapability('admin', 'assignments:manage')).toBe(true);
    });

    it('student cannot use compound capabilities', () => {
      expect(hasCapability('student', 'assignments:manage')).toBe(false);
    });
  });

  describe('hasCapabilities (ALL check)', () => {
    it('returns true when user has all capabilities', () => {
      expect(hasCapabilities('teacher', 'assignments:create', 'assignments:grade', 'deadlines:create')).toBe(true);
    });

    it('returns false when user lacks one capability', () => {
      expect(hasCapabilities('teacher', 'assignments:create', 'users:delete')).toBe(false);
    });

    it('returns false for null role', () => {
      expect(hasCapabilities(null, 'modules:read')).toBe(false);
    });
  });

  describe('hasAnyCapability (ANY check)', () => {
    it('returns true when user has at least one', () => {
      expect(hasAnyCapability('student', 'assignments:grade', 'modules:read')).toBe(true);
    });

    it('returns false when user has none', () => {
      expect(hasAnyCapability('student', 'assignments:grade', 'users:delete', 'auth:impersonate')).toBe(false);
    });

    it('returns false for null role', () => {
      expect(hasAnyCapability(null, 'modules:read')).toBe(false);
    });
  });

  describe('getScopeForCap', () => {
    it('admin always returns all', () => {
      expect(getScopeForCap('admin', 'modules:read')).toBe('all');
      expect(getScopeForCap('admin', 'progress:read_own')).toBe('all');
      expect(getScopeForCap('admin', 'quizzes:take')).toBe('all');
    });

    it('own-scoped capabilities return own for student', () => {
      expect(getScopeForCap('student', 'progress:read_own')).toBe('own');
      expect(getScopeForCap('student', 'profile:read_own')).toBe('own');
      expect(getScopeForCap('student', 'profile:write_own')).toBe('own');
      expect(getScopeForCap('student', 'assignments:submit')).toBe('own');
    });

    it('teacher gets group scope for progress:read', () => {
      expect(getScopeForCap('teacher', 'progress:read_group')).toBe('own');
    });
  });

  describe('listCapabilities', () => {
    it('lists student capabilities', () => {
      const caps = listCapabilities('student');
      expect(caps.length).toBeGreaterThan(10);
      expect(caps).toContain('modules:read');
      expect(caps).toContain('quizzes:take');
    });

    it('teacher has more capabilities than student', () => {
      expect(listCapabilities('teacher').length).toBeGreaterThan(listCapabilities('student').length);
    });

    it('admin has the most capabilities', () => {
      expect(listCapabilities('admin').length).toBeGreaterThan(listCapabilities('teacher').length);
    });

    it('each role includes modules:read', () => {
      for (const role of ['student', 'teacher', 'admin'] as const) {
        expect(listCapabilities(role)).toContain('modules:read');
      }
    });
  });

  describe('getAllCapabilities', () => {
    it('returns all defined capabilities with descriptions', () => {
      const all = getAllCapabilities();
      expect(all.length).toBeGreaterThan(30);
      expect(all[0]).toHaveProperty('key');
      expect(all[0]).toHaveProperty('description');
    });

    it('all capabilities have non-empty descriptions', () => {
      for (const cap of getAllCapabilities()) {
        expect(cap.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('describeCapability', () => {
    it('returns description for known capability', () => {
      expect(describeCapability('modules:read')).toBeTruthy();
      expect(typeof describeCapability('modules:read')).toBe('string');
    });

    it('falls back to key for unknown capability', () => {
      const unknown = 'nonexistent:cap' as 'modules:read';
      expect(describeCapability(unknown)).toBe(unknown);
    });
  });

  describe('Role → Capability integrity', () => {
    it('every capability in ROLE_CAPABILITIES exists in CAPABILITIES', () => {
      const allCapKeys = new Set(getAllCapabilities().map(c => c.key));
      for (const role of ['student', 'teacher', 'admin'] as const) {
        const caps = ROLE_CAPABILITIES[role];
        for (const cap of caps) {
          expect(allCapKeys.has(cap),
            `Role ${role} capability "${cap}" not found in CAPABILITIES`
          ).toBe(true);
        }
      }
    });

    it('student caps are subset of teacher caps', () => {
      const studentCaps = new Set(listCapabilities('student'));
      const teacherCaps = new Set(listCapabilities('teacher'));
      for (const cap of studentCaps) {
        expect(teacherCaps.has(cap),
          `Student cap "${cap}" missing from teacher`
        ).toBe(true);
      }
    });

    it('teacher caps are subset of admin caps', () => {
      const teacherCaps = new Set(listCapabilities('teacher'));
      const adminCaps = new Set(listCapabilities('admin'));
      for (const cap of teacherCaps) {
        expect(adminCaps.has(cap),
          `Teacher cap "${cap}" missing from admin`
        ).toBe(true);
      }
    });

    it('role hierarchy is strict (no role-reversal)', () => {
      const adminOnly = [
        'users:delete', 'users:change_role', 'auth:impersonate',
        'audit:read', 'system:settings', 'users:bulk_ops',
      ] as const;
      for (const cap of adminOnly) {
        expect(hasCapability('student', cap)).toBe(false);
        expect(hasCapability('teacher', cap)).toBe(false);
        expect(hasCapability('admin', cap)).toBe(true);
      }
    });
  });

  describe('Cache consistency', () => {
    it('multiple calls to hasCapability return consistent results', () => {
      for (let i = 0; i < 100; i++) {
        expect(hasCapability('teacher', 'assignments:grade')).toBe(true);
        expect(hasCapability('student', 'assignments:grade')).toBe(false);
      }
    });
  });
});
