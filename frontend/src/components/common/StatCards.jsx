export default function StatCards({ stats, cols = 4, ariaLabel }) {
  const grid = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' }[cols] ?? 'lg:grid-cols-4';
  return (
    <dl className={`grid grid-cols-2 gap-3 ${grid}`} aria-label={ariaLabel}>
      {stats.map(({ label, value, description, valueClass = 'text-slate-900' }) => (
        <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <dt className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</dt>
          <dd className={`mt-1 font-mono text-xl font-bold tabular-nums ${valueClass}`}>{value}</dd>
          {description && <dd className="mt-0.5 text-xs text-slate-500">{description}</dd>}
        </div>
      ))}
    </dl>
  );
}
