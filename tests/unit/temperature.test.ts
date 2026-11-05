import { describe, expect, it } from 'vitest';
import { celsiusToFahrenheit, convertTemperature, formatTemperature } from '../../src/lib/temperature';

describe('celsiusToFahrenheit', () => {
  it('converte pontos conhecidos', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });
});

describe('convertTemperature', () => {
  it('mantém Celsius inalterado', () => {
    expect(convertTemperature(21, 'celsius')).toBe(21);
  });

  it('converte para Fahrenheit quando a unidade é fahrenheit', () => {
    expect(convertTemperature(10, 'fahrenheit')).toBe(50);
  });
});

describe('formatTemperature', () => {
  it('formata em Celsius arredondado', () => {
    expect(formatTemperature(21.6, 'celsius')).toBe('22°');
  });

  it('formata em Fahrenheit', () => {
    expect(formatTemperature(0, 'fahrenheit')).toBe('32°');
  });

  it('retorna travessão para null', () => {
    expect(formatTemperature(null, 'celsius')).toBe('—');
    expect(formatTemperature(null, 'fahrenheit')).toBe('—');
  });
});
