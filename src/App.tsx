import { useState } from 'react';
import type { City } from './types/weather';
import CityResults from './components/CityResults';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import UnitToggle from './components/UnitToggle';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import LocateButton from './components/LocateButton';
import { useWeather } from './hooks/useWeather';

export default function App() {
  const {
    search,
    weather,
    selectedCity,
    unit,
    setUnit,
    submitSearch,
    selectCity,
    retrySearch,
    retryWeather,
  } = useWeather();
  const [showResults, setShowResults] = useState(true);
  const [searchId, setSearchId] = useState(0);
  const [inputResetId, setInputResetId] = useState(0);

  const handleSearch = (term: string) => {
    setShowResults(true);
    setSearchId((id) => id + 1);
    submitSearch(term);
  };

  const handleSelect = (city: City) => {
    setShowResults(false);
    setInputResetId((id) => id + 1);
    selectCity(city);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-night-800 to-night-900">
      <main
        aria-busy={search.status === 'loading' || weather.status === 'loading'}
        className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10"
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">SDD Weather</h1>
          <UnitToggle unit={unit} onChange={setUnit} />
        </header>

        <SearchBar key={`search-input-${inputResetId}`} onSearch={handleSearch} />
        <LocateButton key={`locate-${searchId}`} onLocate={handleSelect} />

        {search.status === 'idle' && weather.status === 'idle' && (
          <EmptyState
            title="Busque uma cidade"
            hint="Digite o nome de uma cidade para ver o clima atual e a previsão de 5 dias."
          />
        )}
        {search.status === 'loading' && <LoadingState message="Buscando cidades..." />}
        {search.status === 'empty' && (
          <EmptyState
            title="Nenhuma cidade encontrada"
            hint="Verifique o nome digitado e tente novamente."
          />
        )}
        {search.status === 'error' && (
          <ErrorState
            message="Não foi possível buscar cidades. Verifique sua conexão e tente novamente."
            onRetry={retrySearch}
          />
        )}
        {search.status === 'success' && showResults && (
          <CityResults cities={search.data} selectedCity={selectedCity} onSelect={handleSelect} />
        )}

        {weather.status === 'loading' && <LoadingState message="Carregando clima..." />}
        {weather.status === 'error' && (
          <ErrorState
            message="Não foi possível carregar o clima desta cidade. Tente novamente."
            onRetry={retryWeather}
          />
        )}
        {weather.status === 'success' && (
          <>
            <CurrentWeather city={weather.data.city} current={weather.data.current} unit={unit} />
            <ForecastList days={weather.data.forecast} unit={unit} />
          </>
        )}
      </main>
    </div>
  );
}
