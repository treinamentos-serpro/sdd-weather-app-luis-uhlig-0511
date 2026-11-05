interface EmptyStateProps {
  title: string;
  hint?: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md"
    >
      <p className="text-lg font-semibold">{title}</p>
      {hint !== undefined && <p className="text-sm text-white/70">{hint}</p>}
    </div>
  );
}
