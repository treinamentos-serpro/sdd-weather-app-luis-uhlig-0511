import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
import { readSavedCity, saveCity } from '../../src/lib/selectedCityStorage';
import { fetchWeather, reverseGeocode, searchCities, WeatherRequestError } from '../../src/services/weatherService';
import type { City, WeatherSnapshot } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/weatherService')>();
  return { ...actual, searchCities: vi.fn(), fetchWeather: vi.fn(), reverseGeocode: vi.fn() };
});

const searchCitiesMock = vi.mocked(searchCities);
const fetchWeatherMock = vi.mocked(fetchWeather);
const reverseGeocodeMock = vi.mocked(reverseGeocode);

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
  forecast: [
    { date: '2026-11-05', minimumC: 10, maximumC: 22, weatherCode: 0, precipitationMm: 0 },
    { date: '2026-11-06', minimumC: 9, maximumC: 20, weatherCode: 1, precipitationMm: 0 },
    { date: '2026-11-07', minimumC: 8, maximumC: 18, weatherCode: 2, precipitationMm: 0.5 },
    { date: '2026-11-08', minimumC: 7, maximumC: 17, weatherCode: 3, precipitationMm: 1 },
    { date: '2026-11-09', minimumC: null, maximumC: null, weatherCode: null, precipitationMm: null },
  ],
  timezone: 'America/Chicago',
};

beforeEach(() => {
  searchCitiesMock.mockReset();
  fetchWeatherMock.mockReset();
  reverseGeocodeMock.mockReset();
  reverseGeocodeMock.mockResolvedValue(null);
});

afterEach(() => {
  Reflect.deleteProperty(navigator, 'geolocation');
});

async function searchAndSelectParis(user: ReturnType<typeof userEvent.setup>) {
  searchCitiesMock.mockResolvedValue([PARIS]);
  fetchWeatherMock.mockResolvedValue(SNAPSHOT);
  await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'Paris{Enter}');
  await user.click(await screen.findByRole('button', { name: /Paris/ }));
  await screen.findByRole('heading', { level: 2, name: 'Paris' });
}

describe('App', () => {
  it('mostra orientação inicial antes de qualquer busca', () => {
    render(<App />);

    expect(screen.getByText('Busque uma cidade')).toBeInTheDocument();
    expect(screen.getByText(/para ver o clima atual/i)).toBeInTheDocument();
  });

  it('busca, seleciona e mostra clima atual com previsão de cinco dias', async () => {
    const user = userEvent.setup();
    render(<App />);

    await searchAndSelectParis(user);

    const current = screen.getByRole('region', { name: 'Paris' });
    expect(within(current).getByText('Texas, Estados Unidos')).toBeInTheDocument();
    expect(within(current).getByText('21°')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Resultados da busca' })).not.toBeInTheDocument();

    const forecast = screen.getByRole('region', { name: 'Previsão para 5 dias' });
    expect(within(forecast).getAllByRole('listitem')).toHaveLength(5);
  });

  it('mostra travessão para o dia sem dados sem ocultar os demais', async () => {
    const user = userEvent.setup();
    render(<App />);

    await searchAndSelectParis(user);

    const forecast = screen.getByRole('region', { name: 'Previsão para 5 dias' });
    expect(within(forecast).getAllByText('—').length).toBeGreaterThan(0);
    expect(within(forecast).getAllByText('Indisponível').length).toBeGreaterThan(0);
    expect(within(forecast).getByText('22°')).toBeInTheDocument();
  });

  it('converte todas as temperaturas ao alternar para Fahrenheit sem nova requisição', async () => {
    const user = userEvent.setup();
    render(<App />);
    await searchAndSelectParis(user);

    await user.click(screen.getByRole('button', { name: '°F' }));

    expect(screen.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('70°')).toBeInTheDocument();
    const forecast = screen.getByRole('region', { name: 'Previsão para 5 dias' });
    expect(within(forecast).getByText('72°')).toBeInTheDocument();
    expect(fetchWeatherMock).toHaveBeenCalledTimes(1);
  });

  it('informa busca sem resultados como estado vazio, não como falha', async () => {
    const user = userEvent.setup();
    searchCitiesMock.mockResolvedValue([]);
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'xyzzy{Enter}');

    expect(await screen.findByText('Nenhuma cidade encontrada')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('informa falha de busca com ação de nova tentativa', async () => {
    const user = userEvent.setup();
    searchCitiesMock
      .mockRejectedValueOnce(new WeatherRequestError({ kind: 'network' }))
      .mockResolvedValueOnce([PARIS]);
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'Paris{Enter}');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível buscar cidades');

    await user.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('button', { name: /Paris/ })).toBeInTheDocument();
    expect(searchCitiesMock).toHaveBeenCalledTimes(2);
  });

  it('limpa o campo de busca ao selecionar uma cidade da lista', async () => {
    const user = userEvent.setup();
    searchCitiesMock.mockResolvedValue([PARIS]);
    fetchWeatherMock.mockResolvedValue(SNAPSHOT);
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'Paris{Enter}');
    await user.click(await screen.findByRole('button', { name: /Paris/ }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Paris' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar cidade' })).toHaveValue('');
  });

  it('mantém a cidade e repete só a consulta do clima após falha', async () => {
    const user = userEvent.setup();
    searchCitiesMock.mockResolvedValue([PARIS]);
    fetchWeatherMock
      .mockRejectedValueOnce(new WeatherRequestError({ kind: 'timeout' }))
      .mockResolvedValueOnce(SNAPSHOT);
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'Paris{Enter}');
    await user.click(await screen.findByRole('button', { name: /Paris/ }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Não foi possível carregar o clima');

    await user.click(within(alert).getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Paris' })).toBeInTheDocument();
    expect(fetchWeatherMock).toHaveBeenCalledTimes(2);
    expect(searchCitiesMock).toHaveBeenCalledTimes(1);
  });

  it('anuncia carregamento da busca', async () => {
    const user = userEvent.setup();
    searchCitiesMock.mockReturnValue(new Promise(() => {}));
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'Paris{Enter}');

    expect(await screen.findByRole('status')).toHaveTextContent('Buscando cidades...');
  });

  it('usa a localização do navegador e salva a cidade no localStorage', async () => {
    const user = userEvent.setup();
    stubGeolocation((success) => success({ coords: { latitude: -23.55, longitude: -46.63 } }));
    reverseGeocodeMock.mockResolvedValue({
      name: 'São Paulo',
      adminRegion: 'São Paulo',
      country: 'Brasil',
      countryCode: 'BR',
    });
    fetchWeatherMock.mockImplementation(async (city) => ({ ...SNAPSHOT, city }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Usar minha localização' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'São Paulo' })).toBeInTheDocument();
    expect(fetchWeatherMock).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: -23.55, longitude: -46.63 }),
      expect.anything(),
    );
    expect(readSavedCity()?.name).toBe('São Paulo');
  });

  it('limpa o campo de busca ao usar a localização', async () => {
    const user = userEvent.setup();
    stubGeolocation((success) => success({ coords: { latitude: -23.55, longitude: -46.63 } }));
    fetchWeatherMock.mockImplementation(async (city) => ({ ...SNAPSHOT, city }));
    render(<App />);

    const input = screen.getByRole('searchbox', { name: 'Buscar cidade' });
    await user.type(input, 'Recife');
    await user.click(screen.getByRole('button', { name: 'Usar minha localização' }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Sua localização' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Buscar cidade' })).toHaveValue('');
  });

  it('informa quando a permissão de localização é negada', async () => {
    const user = userEvent.setup();
    stubGeolocation((_success, failure) => failure({ code: 1 }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Usar minha localização' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Permissão de localização negada');
    expect(fetchWeatherMock).not.toHaveBeenCalled();
  });

  it('oculta a mensagem de permissão negada após nova busca', async () => {
    const user = userEvent.setup();
    stubGeolocation((_success, failure) => failure({ code: 1 }));
    searchCitiesMock.mockResolvedValue([]);
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Usar minha localização' }));
    await screen.findByRole('alert');

    await user.type(screen.getByRole('searchbox', { name: 'Buscar cidade' }), 'xyzzy{Enter}');

    expect(await screen.findByText('Nenhuma cidade encontrada')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('restaura a cidade salva no localStorage ao abrir o app', async () => {
    saveCity(PARIS);
    fetchWeatherMock.mockResolvedValue(SNAPSHOT);
    render(<App />);

    expect(await screen.findByRole('heading', { level: 2, name: 'Paris' })).toBeInTheDocument();
    expect(fetchWeatherMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('region', { name: 'Resultados da busca' })).not.toBeInTheDocument();
    expect(screen.queryByText('Busque uma cidade')).not.toBeInTheDocument();
  });
});

function stubGeolocation(
  impl: (
    success: (position: { coords: { latitude: number; longitude: number } }) => void,
    failure: (error: { code: number }) => void,
  ) => void,
) {
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: vi.fn(impl) },
    configurable: true,
  });
}
