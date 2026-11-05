import { describe, expect, it } from 'vitest';
import { formatLocalTime, formatMeasure, formatShortDate } from '../../src/lib/format';

describe('formatMeasure', () => {
  it('formata valor com unidade em pt-BR', () => {
    expect(formatMeasure(12.3, 'km/h')).toBe('12,3 km/h');
  });

  it('retorna travessão para null', () => {
    expect(formatMeasure(null, 'hPa')).toBe('—');
  });
});

describe('formatShortDate', () => {
  it('gera rótulo curto com dia e mês a partir de data ISO', () => {
    const label = formatShortDate('2026-06-16');
    expect(label).toMatch(/16\/06/);
  });
});

describe('formatLocalTime', () => {
  it('extrai HH:mm do horário local', () => {
    expect(formatLocalTime('2026-06-16T14:00')).toBe('14:00');
  });

  it('retorna null sem horário ou com valor nulo', () => {
    expect(formatLocalTime(null)).toBeNull();
    expect(formatLocalTime('2026-06-16')).toBeNull();
  });
});
