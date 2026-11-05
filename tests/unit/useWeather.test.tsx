import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { fetchWeather, searchCities, WeatherRequestError } from '../../src/services/weatherService';
import type { City, WeatherSnapshot } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), fetchWeather: vi.fn() };
});

const searchCitiesMock = vi.mocked(searchCities);
const fetchWeatherMock = vi.mocked(fetchWeather);

const PARIS: City = {
  id: 1,
  name: 'Paris',
  adminRegion: 'Île-de-France',
  country: 'França',
  countryCode: 'FR',
  latitude: 48.85,
  longitude: 2.35,
  timezone: 'Europe/Paris',
};

const LONDON: City = { ...PARIS, id: 2, name: 'London', adminRegion: null, country: 'Reino Unido' };

const SNAPSHOT: WeatherSnapshot = {
  city: PARIS,
  current: {
    observedAt: '2026-11-05T14:15',
    temperatureC: 21,
    weatherCode: 0,
    humidityPercent: 50,
    windSpeedKmh: 10,
    pressureHpa: 1010,
    precipitationMm: 0,
  },
  forecast: [],
  timezone: 'Europe/Paris',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  searchCitiesMock.mockReset();
  fetchWeatherMock.mockReset();
});

describe('useWeather', () => {
  it('inicia sem busca, sem cidade e em Celsius', () => {
    const { result } = renderHook(() => useWeather());

    expect(result.current.search).toEqual({ status: 'idle' });
    expect(result.current.weather).toEqual({ status: 'idle' });
    expect(result.current.selectedCity).toBeNull();
    expect(result.current.unit).toBe('celsius');
  });

  it('passa por loading até success ao buscar cidades', async () => {
    const pending = deferred<City[]>();
    searchCitiesMock.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.submitSearch('Paris'));
    expect(result.current.search).toEqual({ status: 'loading' });

    await act(async () => pending.resolve([PARIS]));
    expect(result.current.search).toEqual({ status: 'success', data: [PARIS] });
  });

  it('marca busca sem resultados como empty', async () => {
    searchCitiesMock.mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.submitSearch('xyzzy'));

    expect(result.current.search).toEqual({ status: 'empty' });
  });

  it('marca falha de busca como error com o tipo do erro', async () => {
    searchCitiesMock.mockRejectedValue(new WeatherRequestError({ kind: 'network' }));
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.submitSearch('Paris'));

    expect(result.current.search).toEqual({ status: 'error', error: { kind: 'network' } });
  });

  it('dispara consulta do clima ao selecionar uma cidade', async () => {
    fetchWeatherMock.mockResolvedValue(SNAPSHOT);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.selectCity(PARIS));

    expect(fetchWeatherMock).toHaveBeenCalledTimes(1);
    expect(fetchWeatherMock.mock.calls[0][0]).toEqual(PARIS);
    expect(result.current.selectedCity).toEqual(PARIS);
    expect(result.current.weather).toEqual({ status: 'success', data: SNAPSHOT });
  });

  it('marca falha do clima como error sem perder a cidade selecionada', async () => {
    fetchWeatherMock.mockRejectedValue(new WeatherRequestError({ kind: 'timeout' }));
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.selectCity(PARIS));

    expect(result.current.weather).toEqual({ status: 'error', error: { kind: 'timeout' } });
    expect(result.current.selectedCity).toEqual(PARIS);
  });

  it('trocar a unidade não dispara nenhuma requisição', async () => {
    fetchWeatherMock.mockResolvedValue(SNAPSHOT);
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.selectCity(PARIS));

    act(() => result.current.setUnit('fahrenheit'));

    expect(result.current.unit).toBe('fahrenheit');
    expect(fetchWeatherMock).toHaveBeenCalledTimes(1);
    expect(searchCitiesMock).not.toHaveBeenCalled();
  });

  it('retrySearch repete só a busca com o último termo', async () => {
    searchCitiesMock
      .mockRejectedValueOnce(new WeatherRequestError({ kind: 'network' }))
      .mockResolvedValueOnce([PARIS]);
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.submitSearch('Paris'));

    await act(async () => result.current.retrySearch());

    expect(searchCitiesMock).toHaveBeenCalledTimes(2);
    expect(searchCitiesMock.mock.calls[1][0]).toBe('Paris');
    expect(fetchWeatherMock).not.toHaveBeenCalled();
    expect(result.current.search).toEqual({ status: 'success', data: [PARIS] });
  });

  it('retryWeather repete só a consulta da cidade selecionada', async () => {
    fetchWeatherMock
      .mockRejectedValueOnce(new WeatherRequestError({ kind: 'network' }))
      .mockResolvedValueOnce(SNAPSHOT);
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.selectCity(PARIS));

    await act(async () => result.current.retryWeather());

    expect(fetchWeatherMock).toHaveBeenCalledTimes(2);
    expect(searchCitiesMock).not.toHaveBeenCalled();
    expect(result.current.weather).toEqual({ status: 'success', data: SNAPSHOT });
  });

  it('descarta resposta de busca tardia de uma operação anterior', async () => {
    const first = deferred<City[]>();
    const second = deferred<City[]>();
    searchCitiesMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.submitSearch('Paris'));
    act(() => result.current.submitSearch('London'));
    await act(async () => second.resolve([LONDON]));
    await act(async () => first.resolve([PARIS]));

    expect(result.current.search).toEqual({ status: 'success', data: [LONDON] });
  });

  it('descarta consulta de clima tardia de cidade anterior', async () => {
    const first = deferred<WeatherSnapshot>();
    const second = deferred<WeatherSnapshot>();
    fetchWeatherMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.selectCity(PARIS));
    act(() => result.current.selectCity(LONDON));
    await act(async () => second.resolve({ ...SNAPSHOT, city: LONDON }));
    await act(async () => first.resolve(SNAPSHOT));

    expect(result.current.weather).toEqual({ status: 'success', data: { ...SNAPSHOT, city: LONDON } });
  });

  it('cancela requisições pendentes ao desmontar', async () => {
    fetchWeatherMock.mockImplementation(() => new Promise(() => {}));
    const { result, unmount } = renderHook(() => useWeather());
    act(() => result.current.selectCity(PARIS));

    const signal = fetchWeatherMock.mock.calls[0][1] as AbortSignal;
    unmount();

    await waitFor(() => expect(signal.aborted).toBe(true));
  });
});
