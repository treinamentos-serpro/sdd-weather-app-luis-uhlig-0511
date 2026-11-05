interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-accent-400"
      />
      <p className="text-white/80">{message}</p>
    </div>
  );
}
