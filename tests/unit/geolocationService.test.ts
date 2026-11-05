import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reverseGeocode } from '../../src/services/weatherService';
import {
  GeolocationRequestError,
  getCurrentCity,
} from '../../src/services/geolocationService';

vi.mock('../../src/services/weatherService', () => ({ reverseGeocode: vi.fn() }));

const reverseGeocodeMock = vi.mocked(reverseGeocode);

beforeEach(() => {
  reverseGeocodeMock.mockReset();
  reverseGeocodeMock.mockResolvedValue(null);
});

type PositionCallback = (position: { coords: { latitude: number; longitude: number } }) => void;
type ErrorCallback = (error: { code: number }) => void;

function stubGeolocation(impl: (success: PositionCallback, failure: ErrorCallback) => void) {
  const getCurrentPosition = vi.fn(impl);
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition },
    configurable: true,
  });
  return getCurrentPosition;
}

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation');
});

describe('getCurrentCity', () => {
  it('converte a posição do navegador em cidade com coordenadas', async () => {
    stubGeolocation((success) => success({ coords: { latitude: -23.55, longitude: -46.63 } }));

    const city = await getCurrentCity();

    expect(city).toMatchObject({
      name: 'Sua localização',
      latitude: -23.55,
      longitude: -46.63,
      id: null,
    });
  });

  it('usa o nome do lugar retornado pela geocodificação reversa', async () => {
    stubGeolocation((success) => success({ coords: { latitude: -23.55, longitude: -46.63 } }));
    reverseGeocodeMock.mockResolvedValue({
      name: 'São Paulo',
      adminRegion: 'São Paulo',
      country: 'Brasil',
      countryCode: 'BR',
    });

    const city = await getCurrentCity();

    expect(city).toMatchObject({ name: 'São Paulo', country: 'Brasil', countryCode: 'BR' });
  });

  it('informa permissão negada', async () => {
    stubGeolocation((_success, failure) => failure({ code: 1 }));

    await expect(getCurrentCity()).rejects.toMatchObject({ kind: 'denied' });
  });

  it('informa timeout', async () => {
    stubGeolocation((_success, failure) => failure({ code: 3 }));

    await expect(getCurrentCity()).rejects.toMatchObject({ kind: 'timeout' });
  });

  it('informa navegador sem suporte', async () => {
    const error = await getCurrentCity().catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(GeolocationRequestError);
    expect(error).toMatchObject({ kind: 'unsupported' });
  });
});
