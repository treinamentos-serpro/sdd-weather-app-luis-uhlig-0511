interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-2xl border border-red-400/40 bg-red-500/10 p-6 backdrop-blur-md"
    >
      <p className="text-white/90">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-10 rounded-xl bg-accent-600 px-4 font-semibold text-white transition hover:bg-accent-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
      >
        Tentar novamente
      </button>
    </div>
  );
}
