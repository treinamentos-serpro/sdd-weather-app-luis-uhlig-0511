import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWeather, searchCities, WeatherRequestError } from '../services/weatherService';
import type { AsyncState, City, TemperatureUnit, WeatherSnapshot } from '../types/weather';

function toErrorState(error: unknown): AsyncState<never> {
  if (error instanceof WeatherRequestError) {
    return { status: 'error', error: error.error };
  }
  return { status: 'error', error: { kind: 'network' } };
}

export function useWeather() {
  const [search, setSearch] = useState<AsyncState<City[]>>({ status: 'idle' });
  const [weather, setWeather] = useState<AsyncState<WeatherSnapshot>>({ status: 'idle' });
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [unit, setUnit] = useState<TemperatureUnit>('celsius');
  const searchTermRef = useRef('');
  const searchRequestRef = useRef<AbortController | null>(null);
  const weatherRequestRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (term: string) => {
    searchRequestRef.current?.abort();
    const controller = new AbortController();
    searchRequestRef.current = controller;
    setSearch({ status: 'loading' });

    try {
      const cities = await searchCities(term, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setSearch(cities.length === 0 ? { status: 'empty' } : { status: 'success', data: cities });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setSearch(toErrorState(error));
    }
  }, []);

  const loadWeather = useCallback(async (city: City) => {
    weatherRequestRef.current?.abort();
    const controller = new AbortController();
    weatherRequestRef.current = controller;
    setWeather({ status: 'loading' });

    try {
      const snapshot = await fetchWeather(city, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setWeather({ status: 'success', data: snapshot });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setWeather(toErrorState(error));
    }
  }, []);

  const submitSearch = useCallback(
    (term: string) => {
      searchTermRef.current = term;
      void runSearch(term);
    },
    [runSearch],
  );

  const selectCity = useCallback(
    (city: City) => {
      setSelectedCity(city);
      void loadWeather(city);
    },
    [loadWeather],
  );

  const retrySearch = useCallback(() => {
    void runSearch(searchTermRef.current);
  }, [runSearch]);

  const retryWeather = useCallback(() => {
    if (selectedCity !== null) {
      void loadWeather(selectedCity);
    }
  }, [loadWeather, selectedCity]);

  useEffect(
    () => () => {
      searchRequestRef.current?.abort();
      weatherRequestRef.current?.abort();
    },
    [],
  );

  return {
    search,
    weather,
    selectedCity,
    unit,
    setUnit,
    submitSearch,
    selectCity,
    retrySearch,
    retryWeather,
  };
}
