import type { City } from '../types/weather';

const STORAGE_KEY = 'sdd_weather_city';

function asString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function parseCity(value: unknown): City | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = asString(record.name);
  const latitude = asNumber(record.latitude);
  const longitude = asNumber(record.longitude);
  if (
    name === null ||
    name === '' ||
    latitude === null ||
    longitude === null ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return null;
  }

  return {
    id: asNumber(record.id),
    name,
    adminRegion: asString(record.adminRegion),
    country: asString(record.country),
    countryCode: asString(record.countryCode),
    latitude,
    longitude,
    timezone: asString(record.timezone),
  };
}

export function parseSavedCity(raw: string): City | null {
  try {
    return parseCity(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveCity(city: City): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(city));
  } catch {
    // Storage may be unavailable (private mode or quota exceeded); the app works without persistence.
  }
}

export function readSavedCity(): City | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : parseSavedCity(raw);
  } catch {
    return null;
  }
}
