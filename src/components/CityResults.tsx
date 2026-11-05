import { useEffect, useRef } from 'react';
import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  selectedCity: City | null;
  onSelect: (city: City) => void;
}

function cityKey(city: City): string {
  return city.id !== null ? String(city.id) : `${city.latitude},${city.longitude}`;
}

export default function CityResults({ cities, selectedCity, onSelect }: CityResultsProps) {
  const sectionRef = useRef<HTMLElement>(null);

  // Move o foco para os resultados ao montar, para leitores de tela e teclado seguirem a busca.
  useEffect(() => {
    sectionRef.current?.focus();
  }, []);

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-label="Resultados da busca"
      className="flex flex-col gap-2 focus:outline focus:outline-2 focus:outline-accent-400 focus:outline-offset-2"
    >
      <ul className="flex flex-col gap-2">
        {cities.map((city) => {
          const isSelected = selectedCity !== null && cityKey(selectedCity) === cityKey(city);
          const details = [city.adminRegion, city.country].filter(Boolean).join(', ');
          return (
            <li key={cityKey(city)}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(city)}
                className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
                  isSelected
                    ? 'border-accent-400 bg-accent-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="font-semibold">{city.name}</span>
                {details !== '' && <span className="text-sm text-white/70">{details}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
