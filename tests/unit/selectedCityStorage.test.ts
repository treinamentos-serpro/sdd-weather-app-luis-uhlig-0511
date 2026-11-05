import { describe, expect, it } from 'vitest';
import {
  parseCity,
  parseSavedCity,
  readSavedCity,
  saveCity,
} from '../../src/lib/selectedCityStorage';
import type { City } from '../../src/types/weather';

const PARIS: City = {
  id: 1,
  name: 'Paris',
  adminRegion: 'Texas',
  country: 'Estados Unidos',
  countryCode: 'US',
  latitude: 33.66,
  longitude: -95.55,
  timezone: 'America/Chicago',
};

describe('parseCity', () => {
  it('aceita cidade válida e preserva campos opcionais', () => {
    expect(parseCity(PARIS)).toEqual(PARIS);
  });

  it('rejeita coordenadas fora do intervalo e nome vazio', () => {
    expect(parseCity({ ...PARIS, latitude: 120 })).toBeNull();
    expect(parseCity({ ...PARIS, longitude: 200 })).toBeNull();
    expect(parseCity({ ...PARIS, name: '' })).toBeNull();
  });

  it('rejeita valores que não são objetos', () => {
    expect(parseCity(null)).toBeNull();
    expect(parseCity('Paris')).toBeNull();
  });
});

describe('parseSavedCity', () => {
  it('retorna null para JSON inválido', () => {
    expect(parseSavedCity('{não é json')).toBeNull();
  });
});

describe('saveCity e readSavedCity', () => {
  it('grava a cidade no localStorage e a recupera', () => {
    saveCity(PARIS);

    expect(readSavedCity()).toEqual(PARIS);
  });

  it('ignora valor adulterado', () => {
    localStorage.setItem('sdd_weather_city', '{corrompido');

    expect(readSavedCity()).toBeNull();
  });
});
