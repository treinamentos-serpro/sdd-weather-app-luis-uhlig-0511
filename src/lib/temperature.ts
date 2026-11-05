import type { TemperatureUnit } from '../types/weather';
import { UNAVAILABLE } from './format';

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === 'fahrenheit' ? celsiusToFahrenheit(celsius) : celsius;
}

export function formatTemperature(celsius: number | null, unit: TemperatureUnit): string {
  if (celsius === null) {
    return UNAVAILABLE;
  }
  return `${Math.round(convertTemperature(celsius, unit))}°`;
}
