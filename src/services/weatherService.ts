import type {
  City,
  CurrentWeather,
  ForecastDay,
  WeatherError,
  WeatherSnapshot,
} from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_GEOCODING_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const SEARCH_TIMEOUT_MS = 5_000;
const WEATHER_TIMEOUT_MS = 10_000;
const SEARCH_COUNT = 10;
const FORECAST_DAYS = 5;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class WeatherRequestError extends Error {
  readonly error: WeatherError;

  constructor(error: WeatherError) {
    super(error.kind);
    this.name = 'WeatherRequestError';
    this.error = error;
  }
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function throwInvalid(): never {
  throw new WeatherRequestError({ kind: 'invalid-response' });
}

async function requestJson(url: string, timeoutMs: number, signal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const forwardAbort = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  }
  signal?.addEventListener('abort', forwardAbort);

  try {
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (cause) {
      if (signal?.aborted) {
        throw cause;
      }
      throw new WeatherRequestError({ kind: timedOut ? 'timeout' : 'network' });
    }

    if (!response.ok) {
      throw new WeatherRequestError({ kind: 'http', status: response.status });
    }

    try {
      return await response.json();
    } catch {
      throw new WeatherRequestError({ kind: timedOut ? 'timeout' : 'invalid-response' });
    }
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

function toCity(item: unknown): City | null {
  if (!isRecord(item)) {
    return null;
  }

  const name = asString(item.name);
  const latitude = asNumber(item.latitude);
  const longitude = asNumber(item.longitude);
  if (name === null || latitude === null || longitude === null) {
    return null;
  }

  return {
    id: asNumber(item.id),
    name,
    adminRegion: asString(item.admin1),
    country: asString(item.country),
    countryCode: asString(item.country_code),
    latitude,
    longitude,
    timezone: asString(item.timezone),
  };
}

export async function searchCities(term: string, signal?: AbortSignal): Promise<City[]> {
  const name = term.trim();
  if (name === '') {
    return [];
  }

  const params = new URLSearchParams({
    name,
    count: String(SEARCH_COUNT),
    language: 'pt',
    format: 'json',
  });
  const body = await requestJson(`${GEOCODING_URL}?${params}`, SEARCH_TIMEOUT_MS, signal);
  if (!isRecord(body)) {
    throwInvalid();
  }
  if (body.results === undefined || body.results === null) {
    return [];
  }

  const results = asArray(body.results);
  if (results === null) {
    throwInvalid();
  }

  return results.flatMap((item) => {
    const city = toCity(item);
    return city === null ? [] : [city];
  });
}

export interface PlaceName {
  name: string;
  adminRegion: string | null;
  country: string | null;
  countryCode: string | null;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<PlaceName | null> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'pt',
  });
  const body = await requestJson(`${REVERSE_GEOCODING_URL}?${params}`, SEARCH_TIMEOUT_MS, signal);
  if (!isRecord(body)) {
    return null;
  }

  const name = asString(body.city) ?? asString(body.locality);
  if (name === null) {
    return null;
  }

  return {
    name,
    adminRegion: asString(body.principalSubdivision),
    country: asString(body.countryName),
    countryCode: asString(body.countryCode),
  };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function fetchWeather(city: City, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl,precipitation',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
    timezone: 'auto',
    forecast_days: String(FORECAST_DAYS),
  });
  const body = await requestJson(`${FORECAST_URL}?${params}`, WEATHER_TIMEOUT_MS, signal);
  if (!isRecord(body)) {
    throwInvalid();
  }

  const daily = body.daily;
  if (!isRecord(daily)) {
    throwInvalid();
  }
  const times = asArray(daily.time);
  if (times === null || times.length === 0) {
    throwInvalid();
  }
  const firstDate = asString(times[0]);
  if (firstDate === null || !DATE_PATTERN.test(firstDate)) {
    throwInvalid();
  }

  const dates = times.map(asString);
  const column = (key: string): unknown[] => asArray(daily[key]) ?? [];
  const codes = column('weather_code');
  const maximums = column('temperature_2m_max');
  const minimums = column('temperature_2m_min');
  const precipitation = column('precipitation_sum');

  // Cada dia previsto aparece mesmo quando a API não o devolve; seus valores ficam nulos.
  const forecast: ForecastDay[] = Array.from({ length: FORECAST_DAYS }, (_, offset) => {
    const date = addDays(firstDate, offset);
    const index = dates.indexOf(date);
    return {
      date,
      minimumC: index === -1 ? null : asNumber(minimums[index]),
      maximumC: index === -1 ? null : asNumber(maximums[index]),
      weatherCode: index === -1 ? null : asNumber(codes[index]),
      precipitationMm: index === -1 ? null : asNumber(precipitation[index]),
    };
  });

  const currentRaw = body.current;
  const current: JsonRecord = isRecord(currentRaw) ? currentRaw : {};
  const currentWeather: CurrentWeather = {
    observedAt: asString(current.time),
    temperatureC: asNumber(current.temperature_2m),
    weatherCode: asNumber(current.weather_code),
    humidityPercent: asNumber(current.relative_humidity_2m),
    windSpeedKmh: asNumber(current.wind_speed_10m),
    pressureHpa: asNumber(current.pressure_msl),
    precipitationMm: asNumber(current.precipitation),
  };

  return {
    city,
    current: currentWeather,
    forecast,
    timezone: asString(body.timezone),
  };
}
