// Valor exibido quando a API não devolve o dado (resposta parcial).
export const UNAVAILABLE = '—';

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

/** Formata uma medida com unidade (ex.: "12,3 km/h"); `null` vira "—". */
export function formatMeasure(value: number | null, unit: string): string {
  if (value === null) {
    return UNAVAILABLE;
  }
  return `${numberFormatter.format(value)} ${unit}`;
}

/** Converte uma data ISO (AAAA-MM-DD) em rótulo curto, ex.: "ter., 16/06". */
export function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}

/** Extrai HH:mm de um horário local da API (ex.: "2026-06-16T14:00" -> "14:00"). */
export function formatLocalTime(localDateTime: string | null): string | null {
  if (localDateTime === null) {
    return null;
  }
  const time = localDateTime.split('T')[1];
  return time ? time.slice(0, 5) : null;
}
