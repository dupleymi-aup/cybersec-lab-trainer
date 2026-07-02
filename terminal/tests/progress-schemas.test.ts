import { describe, it, expect } from 'vitest';
import { progressSchema, quizResultsSchema, batchProgressSchema } from '@/lib/validations/api';

describe('progressSchema', () => {
  it('should accept valid progress data', () => {
    const result = progressSchema.safeParse({
      type: 'progress',
      payload: {
        moduleId: 'owasp',
        completed: true,
        score: 85,
      },
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing moduleId', () => {
    const result = progressSchema.safeParse({
      type: 'progress',
      payload: { completed: true },
    });
    expect(result.success).toBe(false);
  });

  it('should reject score out of range', () => {
    const result = progressSchema.safeParse({
      type: 'progress',
      payload: { moduleId: 'owasp', completed: true, score: 150 },
    });
    expect(result.success).toBe(false);
  });

  it('should accept progress without score', () => {
    const result = progressSchema.safeParse({
      type: 'progress',
      payload: { moduleId: 'owasp', completed: false },
    });
    expect(result.success).toBe(true);
  });
});

describe('quizResultsSchema', () => {
  it('should accept valid quiz results', () => {
    const result = quizResultsSchema.safeParse({
      type: 'quiz-answers',
      payload: { quizId: 'sql', score: 8, total: 10 },
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing quizId', () => {
    const result = quizResultsSchema.safeParse({
      type: 'quiz-answers',
      payload: { score: 8, total: 10 },
    });
    expect(result.success).toBe(false);
  });

  it('should reject zero total', () => {
    const result = quizResultsSchema.safeParse({
      type: 'quiz-answers',
      payload: { quizId: 'sql', score: 8, total: 0 },
    });
    expect(result.success).toBe(false);
  });
});

describe('batchProgressSchema', () => {
  it('should accept batch progress with modules', () => {
    const result = batchProgressSchema.safeParse({
      progress: [
        { moduleId: 'owasp', completed: true, score: 90 },
        { moduleId: 'sql-injection', completed: false },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should accept batch progress with quiz results', () => {
    const result = batchProgressSchema.safeParse({
      quizResults: [
        { quizId: 'sql', score: 8, total: 10 },
        { quizId: 'xss', score: 9, total: 10 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty batch', () => {
    const result = batchProgressSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
