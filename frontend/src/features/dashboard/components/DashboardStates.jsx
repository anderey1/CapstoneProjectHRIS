import { AlertCircle, RefreshCw } from 'lucide-react';

export function LoadingDashboard() {
  return (
    <div role="status" className="space-y-6 animate-pulse">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
        <span className="loading loading-spinner loading-xs text-primary"></span>
        <span>Loading dashboard figures…</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-28 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="h-3 w-24 rounded bg-slate-200 mb-3" />
            <div className="h-6 w-32 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="h-80 rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="h-4 w-40 rounded bg-slate-200 mb-4" />
            <div className="h-56 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardError({ onRetry, isFetching }) {
  return (
    <section
      role="alert"
      className="rounded-xl border border-rose-200 bg-white p-6"
    >
      <div className="flex items-center gap-2 text-rose-800 font-bold">
        <AlertCircle className="h-5 w-5" />
        <h2 className="text-base">Dashboard could not load</h2>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        Dashboard figures could not be loaded. Retry to restore them.
      </p>
      <button
        type="button"
        disabled={isFetching}
        className="btn btn-primary btn-sm mt-4 flex items-center gap-1.5"
        onClick={onRetry}
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Retry</span>
      </button>
    </section>
  );
}
