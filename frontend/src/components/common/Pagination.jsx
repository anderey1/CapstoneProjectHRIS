import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export default function Pagination({ pagination, label = 'records' }) {
  const { page, count, pageSize = 10, hasNext, hasPrevious, setPage, isFetching, isError, retry } = pagination;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const start = count ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, count);
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter(value => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const buttonClass = 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md border border-slate-500 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:border-[#0038a8] hover:bg-blue-50 hover:text-[#0038a8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0038a8] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-50 disabled:text-slate-500 disabled:hover:bg-slate-50';
  const blocked = isFetching || isError;
  return (
    <nav aria-label={`${label} pagination`} aria-busy={isFetching} className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      {isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-800">
          <p>Could not load {label}.</p>
          <button type="button" className={buttonClass} onClick={() => retry()} disabled={isFetching}>
            <RotateCcw aria-hidden="true" className="size-3.5" /> Retry
          </button>
        </div>
      ) : (
        <div role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate-600">
          <p>
            {count > 0 && <><span className="font-semibold tabular-nums text-slate-900">{start.toLocaleString()}–{end.toLocaleString()}</span> of </>}
            <span className="font-semibold tabular-nums text-slate-900">{count.toLocaleString()}</span> {label}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">{isFetching ? 'Updating records…' : `Page ${page} of ${totalPages}`}</p>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 sm:justify-start">
        <button type="button" className={buttonClass} disabled={!hasPrevious || blocked} onClick={() => setPage(page - 1)}>
          <ChevronLeft aria-hidden="true" className="size-4" /> Previous
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((value, index) => (
            <span key={value} className="inline-flex items-center gap-1">
              {index > 0 && value - pages[index - 1] > 1 && <span aria-hidden="true" className="px-1 text-slate-500">…</span>}
              {value === page ? (
                <span aria-current="page" aria-label={`Page ${value}`} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[#0038a8] bg-blue-50 px-3 text-sm font-semibold tabular-nums text-[#0038a8]">{value}</span>
              ) : (
                <button type="button" aria-label={`Go to page ${value}`} className={buttonClass} disabled={blocked} onClick={() => setPage(value)}>{value}</button>
              )}
            </span>
          ))}
        </div>
        <span className="text-xs tabular-nums text-slate-600 sm:hidden">{page} / {totalPages}</span>
        <button type="button" className={buttonClass} disabled={!hasNext || blocked} onClick={() => setPage(page + 1)}>
          Next <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </nav>
  );
}
