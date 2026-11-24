import { LayoutDashboard, RefreshCw } from 'lucide-react';

export default function DashboardHeader({
  title,
  roleLabel,
  scope,
  asOf,
  isRefreshing,
  onRefresh,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium text-slate-500">
          DepEd Lucena City Division
        </p>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[#0038A8]">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          {roleLabel}
          {scope === 'personal'
            ? ' · Personal records'
            : scope === 'system'
              ? ' · System records'
              : ' · Division records'}
          {asOf ? ` · Updated ${new Date(asOf).toLocaleString()}` : ''}
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Refresh dashboard data"
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? 'motion-safe:animate-spin' : ''}`}
          aria-hidden="true"
        />
        <span>{isRefreshing ? 'Refreshing' : 'Refresh data'}</span>
      </button>
    </div>
  );
}
