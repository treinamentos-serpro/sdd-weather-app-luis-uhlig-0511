import { describe, expect, it } from 'vitest';
import { getWeatherIcon, getWeatherLabel } from '../../src/lib/weatherCodes';

const UNKNOWN_LABEL = 'Condição indisponível';

describe('getWeatherLabel', () => {
  it('retorna rótulo em pt-BR para código conhecido', () => {
    expect(getWeatherLabel(0)).toBe('Céu limpo');
    expect(getWeatherLabel(95)).toBe('Tempestade');
  });

  it('retorna rótulo genérico para código desconhecido', () => {
    expect(getWeatherLabel(1234)).toBe(UNKNOWN_LABEL);
  });

  it('retorna rótulo genérico para null', () => {
    expect(getWeatherLabel(null)).toBe(UNKNOWN_LABEL);
  });
});

describe('getWeatherIcon', () => {
  it('retorna ícone para código conhecido', () => {
    expect(getWeatherIcon(0)).toBe('☀️');
  });

  it('retorna ícone genérico para código desconhecido ou null', () => {
    expect(getWeatherIcon(null)).toBe('❔');
    expect(getWeatherIcon(1234)).toBe('❔');
  });
});
