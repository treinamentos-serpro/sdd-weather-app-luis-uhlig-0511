import { type FormEvent, useId, useState } from 'react';

interface SearchBarProps {
  onSearch: (term: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const [term, setTerm] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const inputId = useId();
  const hintId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = term.trim();

    if (trimmed === '') {
      setHint('Digite o nome de uma cidade para buscar.');
      return;
    }

    setHint(null);
    onSearch(trimmed);
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex w-full flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-white/80">
        Buscar cidade
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Ex.: São Paulo"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={hint !== null}
          aria-describedby={hint !== null ? hintId : undefined}
          className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/70 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        />
        <button
          type="submit"
          disabled={disabled}
          className="h-11 rounded-xl bg-accent-600 px-5 font-semibold text-white transition hover:bg-accent-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 disabled:opacity-50"
        >
          Buscar
        </button>
      </div>
      {hint !== null && (
        <p id={hintId} className="text-sm text-sun">
          {hint}
        </p>
      )}
    </form>
  );
}
