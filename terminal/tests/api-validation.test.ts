import { describe, it, expect } from 'vitest';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  gradeSubmissionSchema,
} from '@/lib/validations/api';

describe('createAssignmentSchema', () => {
  it('should accept valid assignment data', () => {
    const result = createAssignmentSchema.safeParse({
      title: 'Test Assignment',
      type: 'quiz',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing title', () => {
    const result = createAssignmentSchema.safeParse({
      type: 'quiz',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid type', () => {
    const result = createAssignmentSchema.safeParse({
      title: 'Test',
      type: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid types', () => {
    const types = ['quiz', 'code-review', 'attack', 'writeup', 'custom'] as const;
    for (const type of types) {
      const result = createAssignmentSchema.safeParse({ title: 'Test', type });
      expect(result.success).toBe(true);
    }
  });

  it('should use default values', () => {
    const result = createAssignmentSchema.safeParse({
      title: 'Test',
      type: 'quiz',
    });
    if (result.success) {
      expect(result.data.maxScore).toBe(100);
      expect(result.data.passScore).toBe(60);
      expect(result.data.autoGrade).toBe(false);
      expect(result.data.attempts).toBe(1);
      expect(result.data.group).toBe('');
      expect(result.data.published).toBe(false);
    }
  });

  it('should reject negative maxScore', () => {
    const result = createAssignmentSchema.safeParse({
      title: 'Test',
      type: 'quiz',
      maxScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid dueAt date', () => {
    const result = createAssignmentSchema.safeParse({
      title: 'Test',
      type: 'quiz',
      dueAt: '2026-12-31T23:59:59Z',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid dueAt date', () => {
    const result = createAssignmentSchema.safeParse({
      title: 'Test',
      type: 'quiz',
      dueAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateAssignmentSchema', () => {
  it('should accept partial updates', () => {
    const result = updateAssignmentSchema.safeParse({
      title: 'Updated Title',
    });
    expect(result.success).toBe(true);
  });

  it('should accept published toggle', () => {
    const result = updateAssignmentSchema.safeParse({
      published: true,
    });
    expect(result.success).toBe(true);
  });
});

describe('submitAssignmentSchema', () => {
  it('should accept valid submission', () => {
    const result = submitAssignmentSchema.safeParse({
      content: '{"answers": [1, 2, 3]}',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty content', () => {
    const result = submitAssignmentSchema.safeParse({
      content: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing content', () => {
    const result = submitAssignmentSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('gradeSubmissionSchema', () => {
  it('should accept valid grade', () => {
    const result = gradeSubmissionSchema.safeParse({
      score: 85,
      passed: true,
    });
    expect(result.success).toBe(true);
  });

  it('should reject negative score', () => {
    const result = gradeSubmissionSchema.safeParse({
      score: -1,
      passed: true,
    });
    expect(result.success).toBe(false);
  });

  it('should require both score and passed', () => {
    const result1 = gradeSubmissionSchema.safeParse({ score: 85 });
    const result2 = gradeSubmissionSchema.safeParse({ passed: true });
    expect(result1.success).toBe(false);
    expect(result2.success).toBe(false);
  });
});
