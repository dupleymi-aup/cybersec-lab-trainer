import { describe, it, expect } from 'vitest';
import { buildCSV } from '@/lib/export-utils';

describe('CSV export - formula injection prevention', () => {
  it('should sanitize fields starting with = by prefixing with single quote', () => {
    const csv = buildCSV(['Formula'], [['=cmd|"/C calc"!A0']]);
    expect(csv).toContain("'=cmd|\"\"/C calc\"\"!A0");
  });

  it('should sanitize fields starting with + by prefixing with single quote', () => {
    const csv = buildCSV(['Value'], [['+12345678']]);
    expect(csv).toContain("'+12345678");
  });

  it('should sanitize fields starting with - by prefixing with single quote', () => {
    const csv = buildCSV(['Value'], [['-cmd']]);
    expect(csv).toContain("'-cmd");
  });

  it('should sanitize fields starting with @ by prefixing with single quote', () => {
    const csv = buildCSV(['Email'], [['@SUM(A1:A10)']]);
    expect(csv).toContain("'@SUM(A1:A10)");
  });

  it('should sanitize fields starting with tab by prefixing with single quote', () => {
    const csv = buildCSV(['Value'], [['\tmalicious']]);
    expect(csv).toContain("'\tmalicious");
  });

  it('should escape fields with commas', () => {
    const csv = buildCSV(['Name'], [['Doe, John']]);
    expect(csv).toContain('"Doe, John"');
  });

  it('should escape fields with double quotes', () => {
    const csv = buildCSV(['Quote'], [['He said "hello"']]);
    expect(csv).toContain('"He said ""hello"""');
  });

  it('should not escape normal fields', () => {
    const csv1 = buildCSV(['Name'], [['John Doe']]);
    expect(csv1).toContain('"John Doe"');
    const csv2 = buildCSV(['Email'], [['john@example.com']]);
    expect(csv2).toContain('"john@example.com"');
    const csv3 = buildCSV(['Role'], [['student']]);
    expect(csv3).toContain('"student"');
  });

  it('should handle null and undefined', () => {
    const csv1 = buildCSV(['Value'], [[null as any]]);
    expect(csv1).toContain('""');
    const csv2 = buildCSV(['Value'], [[undefined as any]]);
    expect(csv2).toContain('""');
  });

  it('should handle numbers and booleans', () => {
    const csv1 = buildCSV(['Num'], [[123 as any]]);
    expect(csv1).toContain('"123"');
    const csv2 = buildCSV(['Bool'], [[true as any]]);
    expect(csv2).toContain('"true"');
    const csv3 = buildCSV(['Bool'], [[false as any]]);
    expect(csv3).toContain('"false"');
  });
});
