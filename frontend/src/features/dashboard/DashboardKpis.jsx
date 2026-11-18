import { formatChartValue, METRIC_CONFIG } from './dashboardConfig';
import { Activity } from 'lucide-react';

export default function DashboardKpis({ charts, asOf }) {
  const updated = asOf ? new Date(asOf).toLocaleString() : 'the latest refresh';

  return (
    <section aria-labelledby="dashboard-kpi-title" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="dashboard-kpi-title" className="text-base font-semibold text-slate-900">
            Role snapshot
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Recorded totals from this role&apos;s dashboard data.
          </p>
        </div>
        <p className="text-xs text-slate-600">Updated {updated}</p>
      </div>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {charts.map((chart) => {
          const cfg = METRIC_CONFIG[chart.key] || {
            icon: Activity,
            color: 'text-[#0038A8]',
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            badge: chart.unit,
          };
          const Icon = cfg.icon;

          return (
            <div
              key={chart.key}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm sm:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <dt className="truncate text-xs font-bold uppercase tracking-wider text-slate-500">
                    {chart.title}
                  </dt>
                  <dd className="mt-2.5 font-mono text-2xl font-bold tracking-tight tabular-nums text-primary">
                    {formatChartValue(chart.total, chart.unit)}
                  </dd>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.color} shadow-2xs`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                  {cfg.badge || chart.unit}
                </span>
                <span className="truncate font-mono text-[11px] text-slate-500">
                  {chart.period}
                </span>
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
