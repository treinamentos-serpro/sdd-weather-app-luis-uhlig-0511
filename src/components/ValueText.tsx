import { UNAVAILABLE } from '../lib/format';

interface ValueTextProps {
  value: string;
}

// Mostra "—" visualmente e "Indisponível" para leitores de tela.
export default function ValueText({ value }: ValueTextProps) {
  if (value !== UNAVAILABLE) {
    return <>{value}</>;
  }
  return (
    <>
      <span aria-hidden="true">{UNAVAILABLE}</span>
      <span className="sr-only">Indisponível</span>
    </>
  );
}
