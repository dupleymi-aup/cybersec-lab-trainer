import { describe, it, expect } from 'vitest';
import { quizQuestions, quizCategories } from '@/lib/data';

describe('Quiz Questions', () => {
  it('should have questions for all categories', () => {
    const categoriesInQuestions = new Set(quizQuestions.map((q) => q.category));
    for (const cat of quizCategories) {
      expect(categoriesInQuestions.has(cat.name)).toBe(true);
    }
  });

  it('should have valid question structure', () => {
    for (const q of quizQuestions) {
      expect(q.id).toBeDefined();
      expect(q.category).toBeDefined();
      expect(q.difficulty).toBeDefined();
      expect(q.question.length).toBeGreaterThan(0);
      expect(q.options.length).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });

  it('should have questions across all difficulty levels', () => {
    const difficulties = new Set(quizQuestions.map((q) => q.difficulty));
    expect(difficulties.has('easy')).toBe(true);
    expect(difficulties.has('medium')).toBe(true);
    expect(difficulties.has('hard')).toBe(true);
  });

  it('should have unique IDs for all questions', () => {
    const ids = quizQuestions.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('should have at least 100 questions', () => {
    expect(quizQuestions.length).toBeGreaterThanOrEqual(100);
  });

  describe('SQL Injection questions', () => {
    const sqlQuestions = quizQuestions.filter((q) => q.category === 'SQL-инъекции');

    it('should have multiple SQL injection questions', () => {
      expect(sqlQuestions.length).toBeGreaterThan(3);
    });

    it('should have correct answer within options', () => {
      for (const q of sqlQuestions) {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }
    });
  });

  describe('XSS questions', () => {
    const xssQuestions = quizQuestions.filter((q) => q.category === 'XSS-атаки');

    it('should have multiple XSS questions', () => {
      expect(xssQuestions.length).toBeGreaterThan(2);
    });
  });

  describe('CSRF questions', () => {
    const csrfQuestions = quizQuestions.filter((q) => q.category === 'CSRF');

    it('should have CSRF questions', () => {
      expect(csrfQuestions.length).toBeGreaterThan(0);
    });
  });
});

describe('Quiz Categories', () => {
  it('should have unique IDs', () => {
    const ids = quizCategories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have at least 8 categories', () => {
    expect(quizCategories.length).toBeGreaterThanOrEqual(8);
  });

  it('should have questions for each category', () => {
    for (const cat of quizCategories) {
      const count = quizQuestions.filter((q) => q.category === cat.name).length;
      expect(count).toBeGreaterThan(0);
    }
  });
});
