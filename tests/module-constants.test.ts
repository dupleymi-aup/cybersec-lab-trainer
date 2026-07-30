import { describe, it, expect } from 'vitest';
import { MODULE_IDS, MODULE_NAMES, TOTAL_MODULES, CORE_MODULE_IDS } from '@/lib/module-constants';
import type { ModuleId } from '@/lib/module-constants';

describe('module-constants', () => {
  it('MODULE_IDS contains expected modules', () => {
    expect(MODULE_IDS).toContain('owasp');
    expect(MODULE_IDS).toContain('sql-injection');
    expect(MODULE_IDS).toContain('xss');
    expect(MODULE_IDS).toContain('csrf');
    expect(MODULE_IDS).toContain('auth');
    expect(MODULE_IDS).toContain('secure-coding');
    expect(MODULE_IDS).toContain('tools');
    expect(MODULE_IDS).toContain('security-headers');
    expect(MODULE_IDS).toContain('idor');
    expect(MODULE_IDS).toContain('ssrf');
  });

  it('TOTAL_MODULES matches MODULE_IDS length', () => {
    expect(TOTAL_MODULES).toBe(MODULE_IDS.length);
  });

  it('MODULE_NAMES has entries for all MODULE_IDS', () => {
    for (const id of MODULE_IDS) {
      expect(MODULE_NAMES[id]).toBeDefined();
      expect(typeof MODULE_NAMES[id]).toBe('string');
      expect(MODULE_NAMES[id].length).toBeGreaterThan(0);
    }
  });

  it('CORE_MODULE_IDS is a subset of MODULE_IDS', () => {
    for (const id of CORE_MODULE_IDS) {
      expect(MODULE_IDS).toContain(id);
    }
  });

  it('CORE_MODULE_IDS has 8 modules', () => {
    expect(CORE_MODULE_IDS).toHaveLength(8);
  });

  it('MODULE_IDS has exactly 10 modules', () => {
    expect(MODULE_IDS).toHaveLength(10);
  });
});
