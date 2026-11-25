import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { SCOPE_META } from '../dashboardConfig';

export default function DashboardHeader({
  title,
  roleLabel,
  scope,
  asOf,
  isRefreshing,
  onRefresh,
}) {
  const scopeLabel = (SCOPE_META[scope] || SCOPE_META.division).label;

  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        <p className="text-xs font-medium text-slate-500">
          DepEd Lucena City Division
        </p>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-primary">
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{roleLabel}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
            {scopeLabel}
          </span>
          {asOf && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 tabular-nums">
                Updated {new Date(asOf).toLocaleString()}
              </span>
            </>
          )}
        </div>
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
