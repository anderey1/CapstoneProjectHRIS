export default function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3" role="status">
      <span className="loading loading-spinner loading-lg text-primary" aria-hidden="true" />
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    </div>
  );
}
