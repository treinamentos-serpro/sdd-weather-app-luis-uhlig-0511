interface WeatherCodeInfo {
  label: string;
  icon: string;
}

// Códigos WMO usados pela Open-Meteo.
const WEATHER_CODES = new Map<number, WeatherCodeInfo>([
  [0, { label: 'Céu limpo', icon: '☀️' }],
  [1, { label: 'Predominantemente limpo', icon: '🌤️' }],
  [2, { label: 'Parcialmente nublado', icon: '⛅' }],
  [3, { label: 'Nublado', icon: '☁️' }],
  [45, { label: 'Nevoeiro', icon: '🌫️' }],
  [48, { label: 'Nevoeiro com geada', icon: '🌫️' }],
  [51, { label: 'Garoa fraca', icon: '🌦️' }],
  [53, { label: 'Garoa moderada', icon: '🌦️' }],
  [55, { label: 'Garoa intensa', icon: '🌦️' }],
  [56, { label: 'Garoa congelante fraca', icon: '🌧️' }],
  [57, { label: 'Garoa congelante intensa', icon: '🌧️' }],
  [61, { label: 'Chuva fraca', icon: '🌧️' }],
  [63, { label: 'Chuva moderada', icon: '🌧️' }],
  [65, { label: 'Chuva forte', icon: '🌧️' }],
  [66, { label: 'Chuva congelante fraca', icon: '🌧️' }],
  [67, { label: 'Chuva congelante forte', icon: '🌧️' }],
  [71, { label: 'Neve fraca', icon: '🌨️' }],
  [73, { label: 'Neve moderada', icon: '🌨️' }],
  [75, { label: 'Neve forte', icon: '❄️' }],
  [77, { label: 'Grãos de neve', icon: '❄️' }],
  [80, { label: 'Pancadas de chuva fracas', icon: '🌦️' }],
  [81, { label: 'Pancadas de chuva moderadas', icon: '🌧️' }],
  [82, { label: 'Pancadas de chuva fortes', icon: '🌧️' }],
  [85, { label: 'Pancadas de neve fracas', icon: '🌨️' }],
  [86, { label: 'Pancadas de neve fortes', icon: '🌨️' }],
  [95, { label: 'Tempestade', icon: '⛈️' }],
  [96, { label: 'Tempestade com granizo', icon: '⛈️' }],
  [99, { label: 'Tempestade forte com granizo', icon: '⛈️' }],
]);

const UNKNOWN: WeatherCodeInfo = { label: 'Condição indisponível', icon: '❔' };

function getInfo(code: number | null): WeatherCodeInfo {
  if (code === null) {
    return UNKNOWN;
  }
  return WEATHER_CODES.get(code) ?? UNKNOWN;
}

export function getWeatherLabel(code: number | null): string {
  return getInfo(code).label;
}

export function getWeatherIcon(code: number | null): string {
  return getInfo(code).icon;
}
