import { expect, type Page, type Route, test } from '@playwright/test';

const GEOCODING_RESULT = {
  results: [
    {
      id: 5808805,
      name: 'Seattle',
      latitude: 47.60621,
      longitude: -122.33207,
      country: 'Estados Unidos',
      admin1: 'Washington',
      timezone: 'America/Los_Angeles',
    },
  ],
};

const FORECAST_RESULT = {
  timezone: 'America/Los_Angeles',
  current: {
    time: '2026-06-16T12:00',
    temperature_2m: 18.4,
    relative_humidity_2m: 80,
    wind_speed_10m: 10,
    surface_pressure: 1015,
    precipitation: 0,
    weather_code: 3,
  },
  daily: {
    time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
    weather_code: [3, 61, 80, 1, 0],
    temperature_2m_max: [20, 19, 22, 24, 25],
    temperature_2m_min: [12, 11, 13, 14, 15],
    precipitation_sum: [0, 2.5, 1.2, 0, 0],
  },
};

interface ApiOptions {
  failSearchTimes?: number;
  failForecastTimes?: number;
  searchResults?: unknown;
}

interface ApiCalls {
  search: number;
  forecast: number;
}

/**
 * Intercepta toda chamada à Open-Meteo. Nenhuma requisição real sai da máquina.
 * Respostas com falha são servidas antes das de sucesso.
 */
async function mockOpenMeteo(page: Page, options: ApiOptions = {}): Promise<ApiCalls> {
  const calls: ApiCalls = { search: 0, forecast: 0 };
  let searchFailures = options.failSearchTimes ?? 0;
  let forecastFailures = options.failForecastTimes ?? 0;

  await page.route('https://*.open-meteo.com/**', async (route: Route) => {
    const url = new URL(route.request().url());

    if (url.hostname === 'geocoding-api.open-meteo.com') {
      calls.search += 1;
      if (searchFailures > 0) {
        searchFailures -= 1;
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
      const body = options.searchResults ?? GEOCODING_RESULT;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    }

    if (url.hostname === 'api.open-meteo.com') {
      calls.forecast += 1;
      if (forecastFailures > 0) {
        forecastFailures -= 1;
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(FORECAST_RESULT),
      });
    }

    return route.abort();
  });

  return calls;
}

async function searchFor(page: Page, term: string) {
  await page.getByRole('searchbox', { name: 'Buscar cidade' }).fill(term);
  await page.getByRole('button', { name: 'Buscar' }).click();
}

test.describe('Weather App', () => {
  test('busca, seleciona e exibe clima atual e previsão de 5 dias', async ({ page }) => {
    await mockOpenMeteo(page);
    await page.goto('/');

    await searchFor(page, 'Seattle');
    await page.getByRole('button', { name: /Seattle/ }).click();

    const current = page.getByRole('region', { name: 'Seattle' });
    await expect(current).toBeVisible();
    await expect(current.getByText('18°')).toBeVisible();

    const forecast = page.getByRole('region', { name: 'Previsão para 5 dias' });
    await expect(forecast.getByRole('listitem')).toHaveCount(5);
  });

  test('alterna para Fahrenheit sem nova requisição de clima', async ({ page }) => {
    const calls = await mockOpenMeteo(page);
    await page.goto('/');
    await searchFor(page, 'Seattle');
    await page.getByRole('button', { name: /Seattle/ }).click();
    await expect(page.getByRole('region', { name: 'Seattle' })).toBeVisible();

    await page.getByRole('button', { name: '°F' }).click();

    await expect(page.getByRole('button', { name: '°F' })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('region', { name: 'Seattle' }).getByText('65°')).toBeVisible();
    expect(calls.forecast).toBe(1);
  });

  test('busca vazia mostra orientação e não chama a API', async ({ page }) => {
    const calls = await mockOpenMeteo(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Buscar' }).click();

    await expect(page.getByText('Digite o nome de uma cidade para buscar.')).toBeVisible();
    expect(calls.search).toBe(0);
  });

  test('falha na busca oferece nova tentativa que funciona', async ({ page }) => {
    const calls = await mockOpenMeteo(page, { failSearchTimes: 1 });
    await page.goto('/');

    await searchFor(page, 'Seattle');
    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Não foi possível buscar cidades');

    await alert.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByRole('button', { name: /Seattle/ })).toBeVisible();
    expect(calls.search).toBe(2);
  });

  test('falha no clima mantém a cidade e permite nova tentativa', async ({ page }) => {
    const calls = await mockOpenMeteo(page, { failForecastTimes: 1 });
    await page.goto('/');
    await searchFor(page, 'Seattle');
    await page.getByRole('button', { name: /Seattle/ }).click();

    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Não foi possível carregar o clima');

    await alert.getByRole('button', { name: 'Tentar novamente' }).click();

    await expect(page.getByRole('region', { name: 'Seattle' })).toBeVisible();
    expect(calls.forecast).toBe(2);
    expect(calls.search).toBe(1);
  });

  test('fluxo completo por teclado', async ({ page }) => {
    await mockOpenMeteo(page);
    await page.goto('/');

    await page.getByRole('searchbox', { name: 'Buscar cidade' }).focus();
    await page.keyboard.type('Seattle');
    await page.keyboard.press('Enter');

    const city = page.getByRole('button', { name: /Seattle/ });
    await expect(city).toBeVisible();
    await city.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('region', { name: 'Seattle' })).toBeVisible();
  });

  test('não há rolagem horizontal em 320 px de largura', async ({ page }) => {
    await mockOpenMeteo(page);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');
    await searchFor(page, 'Seattle');
    await page.getByRole('button', { name: /Seattle/ }).click();
    await expect(page.getByRole('region', { name: 'Previsão para 5 dias' })).toBeVisible();

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});
