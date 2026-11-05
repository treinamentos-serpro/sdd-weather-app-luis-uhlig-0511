import type { City } from '../types/weather';
import { type PlaceName, reverseGeocode } from './weatherService';

const LOCATION_TIMEOUT_MS = 10_000;
const LOCATION_MAX_AGE_MS = 5 * 60_000;
const CURRENT_LOCATION_NAME = 'Sua localização';

export type GeolocationErrorKind = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export class GeolocationRequestError extends Error {
  readonly kind: GeolocationErrorKind;

  constructor(kind: GeolocationErrorKind) {
    super(kind);
    this.name = 'GeolocationRequestError';
    this.kind = kind;
  }
}

function toErrorKind(code: number): GeolocationErrorKind {
  if (code === 1) {
    return 'denied';
  }
  if (code === 3) {
    return 'timeout';
  }
  return 'unavailable';
}

function buildCurrentCity(latitude: number, longitude: number, place: PlaceName | null): City {
  return {
    id: null,
    name: place?.name ?? CURRENT_LOCATION_NAME,
    adminRegion: place?.adminRegion ?? null,
    country: place?.country ?? null,
    countryCode: place?.countryCode ?? null,
    latitude,
    longitude,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
  };
}

function readPosition(): Promise<{ latitude: number; longitude: number }> {
  if (!('geolocation' in navigator)) {
    return Promise.reject(new GeolocationRequestError('unsupported'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new GeolocationRequestError(toErrorKind(error.code))),
      { timeout: LOCATION_TIMEOUT_MS, maximumAge: LOCATION_MAX_AGE_MS },
    );
  });
}

export async function getCurrentCity(): Promise<City> {
  const { latitude, longitude } = await readPosition();
  const place = await reverseGeocode(latitude, longitude).catch(() => null);
  return buildCurrentCity(latitude, longitude, place);
}
