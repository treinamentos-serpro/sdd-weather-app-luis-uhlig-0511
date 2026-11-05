export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface City {
  id: number | null;
  name: string;
  adminRegion: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
}

export interface CurrentWeather {
  observedAt: string | null;
  temperatureC: number | null;
  weatherCode: number | null;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  pressureHpa: number | null;
  precipitationMm: number | null;
}

export interface ForecastDay {
  date: string;
  minimumC: number | null;
  maximumC: number | null;
  weatherCode: number | null;
  precipitationMm: number | null;
}

export interface WeatherSnapshot {
  city: City;
  current: CurrentWeather;
  forecast: ForecastDay[];
  timezone: string | null;
}

export type WeatherError =
  | { kind: 'network' }
  | { kind: 'http'; status: number }
  | { kind: 'timeout' }
  | { kind: 'invalid-response' };

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; error: WeatherError };
