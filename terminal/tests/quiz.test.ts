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

  describe('Phishing questions', () => {
    const phishingQuestions = quizQuestions.filter((q) => q.category === 'Фишинг');

    it('should have phishing questions covering modern attack types', () => {
      expect(phishingQuestions.length).toBeGreaterThanOrEqual(5);
    });

    it('should include BEC and social engineering topics', () => {
      const hasBEC = phishingQuestions.some((q) =>
        q.question.includes('BEC') || q.question.includes('руководител')
      );
      expect(hasBEC).toBe(true);
    });
  });

  describe('Security Tools questions', () => {
    const toolQuestions = quizQuestions.filter((q) => q.category === 'Инструменты безопасности');

    it('should have security tools questions', () => {
      expect(toolQuestions.length).toBeGreaterThanOrEqual(5);
    });

    it('should cover multiple tool categories', () => {
      const toolNames = ['Nmap', 'Burp', 'Wireshark', 'sqlmap', 'ZAP', 'Hydra', 'Gobuster', 'Nikto'];
      const covered = toolNames.filter((name) =>
        toolQuestions.some((q) => q.question.includes(name))
      );
      expect(covered.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('IDOR questions', () => {
    const idorQuestions = quizQuestions.filter((q) => q.category === 'IDOR-атаки');

    it('should have IDOR questions', () => {
      expect(idorQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('SSRF questions', () => {
    const ssrfQuestions = quizQuestions.filter((q) => q.category === 'SSRF-атаки');

    it('should have SSRF questions', () => {
      expect(ssrfQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('API Security questions', () => {
    const apiQuestions = quizQuestions.filter((q) => q.category === 'Безопасность API');

    it('should have API security questions', () => {
      expect(apiQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('correctIndex distribution', () => {
    it('should have balanced correct answer positions (no single position over 35%)', () => {
      const dist: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
      for (const q of quizQuestions) {
        dist[q.correctIndex]++;
      }
      const total = quizQuestions.length;
      for (const [idx, count] of Object.entries(dist)) {
        const pct = count / total;
        expect(pct).toBeLessThan(0.35);
      }
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
