import { useState } from 'react';
import {
  type GeolocationErrorKind,
  GeolocationRequestError,
  getCurrentCity,
} from '../services/geolocationService';
import type { City } from '../types/weather';

interface LocateButtonProps {
  onLocate: (city: City) => void;
}

const ERROR_MESSAGES: Record<GeolocationErrorKind, string> = {
  unsupported: 'Seu navegador não oferece geolocalização. Busque a cidade manualmente.',
  denied: 'Permissão de localização negada. Busque a cidade manualmente.',
  unavailable: 'Não foi possível obter sua localização. Tente novamente.',
  timeout: 'Não foi possível obter sua localização a tempo. Tente novamente.',
};

export default function LocateButton({ onLocate }: LocateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorKind, setErrorKind] = useState<GeolocationErrorKind | null>(null);

  async function handleClick() {
    setLoading(true);
    setErrorKind(null);
    try {
      const city = await getCurrentCity();
      setLoading(false);
      onLocate(city);
    } catch (error) {
      setLoading(false);
      setErrorKind(error instanceof GeolocationRequestError ? error.kind : 'unavailable');
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="h-9 self-start rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-50"
      >
        {loading ? 'Obtendo localização...' : 'Usar minha localização'}
      </button>
      {errorKind !== null && (
        <p role="alert" className="text-sm text-sun">
          {ERROR_MESSAGES[errorKind]}
        </p>
      )}
    </div>
  );
}
