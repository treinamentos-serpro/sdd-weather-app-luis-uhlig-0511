import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWeather, searchCities } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

const PARIS: City = {
  id: 2988507,
  name: 'Paris',
  adminRegion: 'Île-de-France',
  country: 'França',
  countryCode: 'FR',
  latitude: 48.85341,
  longitude: 2.3488,
  timezone: 'Europe/Paris',
};

const GEOCODING_BODY = {
  results: [
    {
      id: 2988507,
      name: 'Paris',
      latitude: 48.85341,
      longitude: 2.3488,
      admin1: 'Île-de-France',
      country: 'França',
      country_code: 'FR',
      timezone: 'Europe/Paris',
    },
  ],
};

const FORECAST_DATES = ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09'];

function forecastBody(overrides: Record<string, unknown> = {}) {
  return {
    timezone: 'Europe/Paris',
    current: {
      time: '2026-11-05T14:15',
      temperature_2m: 21.4,
      relative_humidity_2m: 60,
      weather_code: 3,
      wind_speed_10m: 12.5,
      pressure_msl: 1015,
      precipitation: 0,
    },
    daily: {
      time: FORECAST_DATES,
      weather_code: [0, 1, 2, 3, 61],
      temperature_2m_max: [22, 20, 18, 17, 15],
      temperature_2m_min: [10, 9, 8, 7, 6],
      precipitation_sum: [0, 0, 0.5, 1, 4],
    },
    ...overrides,
  };
}

function requestedUrl(callIndex = 0): URL {
  return new URL(fetchMock.mock.calls[callIndex][0] as string);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('searchCities', () => {
  it('retorna cidades normalizadas com região e país', async () => {
    fetchMock.mockResolvedValue(jsonResponse(GEOCODING_BODY));

    const cities = await searchCities('Paris');

    expect(cities).toEqual([PARIS]);
  });

  it('envia nome, limite, idioma e formato nos parâmetros', async () => {
    fetchMock.mockResolvedValue(jsonResponse(GEOCODING_BODY));

    await searchCities('  São Paulo  ');

    const url = requestedUrl();
    expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
    expect(url.searchParams.get('name')).toBe('São Paulo');
    expect(url.searchParams.get('count')).toBe('10');
    expect(url.searchParams.get('language')).toBe('pt');
    expect(url.searchParams.get('format')).toBe('json');
  });

  it('codifica caracteres especiais sem vazar parâmetros extras', async () => {
    fetchMock.mockResolvedValue(jsonResponse(GEOCODING_BODY));

    await searchCities('A&B #1 ?x=y');

    const url = requestedUrl();
    expect(url.searchParams.get('name')).toBe('A&B #1 ?x=y');
    expect(url.searchParams.has('x')).toBe(false);
  });

  it('não faz requisição para termo vazio ou só com espaços', async () => {
    await expect(searchCities('')).resolves.toEqual([]);
    await expect(searchCities('   ')).resolves.toEqual([]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('retorna lista vazia quando results está ausente', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ generationtime_ms: 1 }));

    await expect(searchCities('xyzzy')).resolves.toEqual([]);
  });

  it('retorna lista vazia quando results é uma lista vazia', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ results: [] }));

    await expect(searchCities('xyzzy')).resolves.toEqual([]);
  });

  it('ignora itens sem nome ou coordenadas', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ results: [{ name: 'Sem coordenadas' }, GEOCODING_BODY.results[0]] }),
    );

    const cities = await searchCities('Paris');

    expect(cities).toHaveLength(1);
    expect(cities[0].name).toBe('Paris');
  });

  it('retorna erro de rede quando fetch falha', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(searchCities('Paris')).rejects.toMatchObject({ error: { kind: 'network' } });
  });

  it('retorna erro HTTP com status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 503));

    await expect(searchCities('Paris')).rejects.toMatchObject({
      error: { kind: 'http', status: 503 },
    });
  });

  it('retorna resposta inválida quando results não é lista', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ results: 'Paris' }));

    await expect(searchCities('Paris')).rejects.toMatchObject({
      error: { kind: 'invalid-response' },
    });
  });

  it('retorna resposta inválida quando o corpo não é JSON', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    } as unknown as Response);

    await expect(searchCities('Paris')).rejects.toMatchObject({
      error: { kind: 'invalid-response' },
    });
  });

  it('retorna timeout após 5 segundos sem resposta', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );

    const result = searchCities('Paris').catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(5_000);

    await expect(result).resolves.toMatchObject({ error: { kind: 'timeout' } });
  });

  it('propaga cancelamento feito pelo chamador sem transformar em erro', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );

    const promise = searchCities('Paris', controller.signal);
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    await expect(promise).rejects.not.toHaveProperty('error');
  });
});

describe('fetchWeather', () => {
  it('retorna clima atual e previsão de exatamente cinco dias', async () => {
    fetchMock.mockResolvedValue(jsonResponse(forecastBody()));

    const snapshot = await fetchWeather(PARIS);

    expect(snapshot.city).toEqual(PARIS);
    expect(snapshot.timezone).toBe('Europe/Paris');
    expect(snapshot.current).toEqual({
      observedAt: '2026-11-05T14:15',
      temperatureC: 21.4,
      weatherCode: 3,
      humidityPercent: 60,
      windSpeedKmh: 12.5,
      pressureHpa: 1015,
      precipitationMm: 0,
    });
    expect(snapshot.forecast).toHaveLength(5);
    expect(snapshot.forecast[0]).toEqual({
      date: '2026-11-05',
      minimumC: 10,
      maximumC: 22,
      weatherCode: 0,
      precipitationMm: 0,
    });
    expect(snapshot.forecast[4].date).toBe('2026-11-09');
  });

  it('envia coordenadas e parâmetros do plano', async () => {
    fetchMock.mockResolvedValue(jsonResponse(forecastBody()));

    await fetchWeather(PARIS);

    const url = requestedUrl();
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('48.85341');
    expect(url.searchParams.get('longitude')).toBe('2.3488');
    expect(url.searchParams.get('current')).toBe(
      'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,pressure_msl,precipitation',
    );
    expect(url.searchParams.get('daily')).toBe(
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
    );
    expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    expect(url.searchParams.get('wind_speed_unit')).toBe('kmh');
    expect(url.searchParams.get('precipitation_unit')).toBe('mm');
    expect(url.searchParams.get('timezone')).toBe('auto');
    expect(url.searchParams.get('forecast_days')).toBe('5');
  });

  it('mantém cinco dias e nulos quando a API devolve menos dias', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        forecastBody({
          daily: {
            time: FORECAST_DATES.slice(0, 3),
            weather_code: [0, 1, 2],
            temperature_2m_max: [22, 20, 18],
            temperature_2m_min: [10, 9, 8],
            precipitation_sum: [0, 0, 0.5],
          },
        }),
      ),
    );

    const { forecast } = await fetchWeather(PARIS);

    expect(forecast.map((day) => day.date)).toEqual(FORECAST_DATES);
    expect(forecast[3]).toEqual({
      date: '2026-11-08',
      minimumC: null,
      maximumC: null,
      weatherCode: null,
      precipitationMm: null,
    });
  });

  it('preenche com null campos atuais ausentes sem falhar', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(forecastBody({ current: { time: '2026-11-05T14:15', temperature_2m: 19 } })),
    );

    const { current } = await fetchWeather(PARIS);

    expect(current.temperatureC).toBe(19);
    expect(current.humidityPercent).toBeNull();
    expect(current.windSpeedKmh).toBeNull();
    expect(current.pressureHpa).toBeNull();
    expect(current.precipitationMm).toBeNull();
  });

  it('retorna resposta inválida quando daily está ausente', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ current: {} }));

    await expect(fetchWeather(PARIS)).rejects.toMatchObject({
      error: { kind: 'invalid-response' },
    });
  });

  it('retorna resposta inválida quando daily.time não tem datas válidas', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(forecastBody({ daily: { time: ['amanhã'], weather_code: [] } })),
    );

    await expect(fetchWeather(PARIS)).rejects.toMatchObject({
      error: { kind: 'invalid-response' },
    });
  });

  it('retorna erro de rede quando fetch falha', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(fetchWeather(PARIS)).rejects.toMatchObject({ error: { kind: 'network' } });
  });

  it('retorna erro HTTP com status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ reason: 'bad request' }, 400));

    await expect(fetchWeather(PARIS)).rejects.toMatchObject({
      error: { kind: 'http', status: 400 },
    });
  });

  it('retorna timeout após 10 segundos sem resposta', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );

    const result = fetchWeather(PARIS).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(result).resolves.toMatchObject({ error: { kind: 'timeout' } });
  });
});
