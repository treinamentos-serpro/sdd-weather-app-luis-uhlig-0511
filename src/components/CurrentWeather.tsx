import { useId } from 'react';
import type { City, CurrentWeather as CurrentWeatherData, TemperatureUnit } from '../types/weather';
import { formatLocalTime, formatMeasure } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherIcon, getWeatherLabel } from '../lib/weatherCodes';
import ValueText from './ValueText';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: TemperatureUnit;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const headingId = useId();
  const region = [city.adminRegion, city.country].filter(Boolean).join(', ');
  const observedTime = formatLocalTime(current.observedAt);

  const details = [
    { label: 'Umidade', value: formatMeasure(current.humidityPercent, '%') },
    { label: 'Vento', value: formatMeasure(current.windSpeedKmh, 'km/h') },
    { label: 'Pressão', value: formatMeasure(current.pressureHpa, 'hPa') },
    { label: 'Precipitação', value: formatMeasure(current.precipitationMm, 'mm') },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glass backdrop-blur-md"
    >
      <header>
        <h2 id={headingId} className="text-2xl font-semibold">
          {city.name}
        </h2>
        {region !== '' && <p className="text-sm text-white/70">{region}</p>}
      </header>

      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="text-6xl">
          {getWeatherIcon(current.weatherCode)}
        </span>
        <div>
          <p className="text-7xl font-bold leading-none">
            <ValueText value={formatTemperature(current.temperatureC, unit)} />
          </p>
          <p className="mt-2 text-lg text-white/80">{getWeatherLabel(current.weatherCode)}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {details.map((detail) => (
          <div key={detail.label} className="rounded-2xl bg-white/5 p-3">
            <dt className="text-xs uppercase tracking-wide text-white/60">{detail.label}</dt>
            <dd className="mt-1 font-semibold">
              <ValueText value={detail.value} />
            </dd>
          </div>
        ))}
      </dl>

      {observedTime !== null && (
        <p className="text-xs text-white/60">Atualizado às {observedTime} (horário local)</p>
      )}
    </section>
  );
}
