import { Activity, BarChart3 } from 'lucide-react';
import { formatChartValue, METRIC_CONFIG } from './dashboardConfig';

export default function DashboardKpis({ charts }) {
  const gridCols = charts.length === 3
    ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section aria-labelledby="dashboard-kpi-title" className="space-y-3">
      <div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 id="dashboard-kpi-title" className="text-base font-semibold text-slate-900">
            Role snapshot
          </h2>
        </div>
        <p className="mt-0.5 text-xs text-slate-600">
          Recorded totals from this role&apos;s operational data.
        </p>
      </div>

      <dl className={`grid gap-3 ${gridCols}`}>
        {charts.map((chart) => {
          const config = METRIC_CONFIG[chart.key];
          const sourceLabel = config?.sourceLabel || chart.unit;
          const Icon = config?.icon || BarChart3;

          return (
            <div
              key={chart.key}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <dt className="text-xs font-semibold text-slate-600">
                    {chart.title}
                  </dt>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-primary">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <dd className="mt-2 text-2xl font-bold tracking-tight tabular-nums text-primary">
                  {formatChartValue(chart.total, chart.unit)}
                </dd>
              </div>

              <dd className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                <span className="truncate">{chart.period}</span>
                <span className="shrink-0 font-medium text-slate-600">{sourceLabel}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
