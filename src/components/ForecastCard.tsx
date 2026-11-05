import type { ForecastDay, TemperatureUnit } from '../types/weather';
import { formatMeasure, formatShortDate } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';
import ValueText from './ValueText';

interface ForecastCardProps {
  day: ForecastDay;
  unit: TemperatureUnit;
}

export default function ForecastCard({ day, unit }: ForecastCardProps) {
  return (
    <li className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-center shadow-glass backdrop-blur-md">
      <p className="text-sm font-medium capitalize text-white/80">{formatShortDate(day.date)}</p>
      <span aria-hidden="true" className="text-3xl">
        {getWeatherIcon(day.weatherCode)}
      </span>
      <p className="text-xs text-white/70">{getWeatherLabel(day.weatherCode)}</p>
      <p className="font-semibold">
        <span className="text-sun">
          <ValueText value={formatTemperature(day.maximumC, unit)} />
        </span>
        <span className="text-white/50"> / </span>
        <span>
          <ValueText value={formatTemperature(day.minimumC, unit)} />
        </span>
      </p>
      <p className="text-xs text-white/60">
        Chuva: <ValueText value={formatMeasure(day.precipitationMm, 'mm')} />
      </p>
    </li>
  );
}
