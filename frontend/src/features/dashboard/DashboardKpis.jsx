import { formatChartValue, METRIC_CONFIG } from './dashboardConfig';

export default function DashboardKpis({ charts, asOf }) {
  const updated = asOf ? new Date(asOf).toLocaleString() : null;

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
        {updated && <p className="text-xs text-slate-600">Updated {updated}</p>}
      </div>

      <dl className="flex gap-3 justify-between">
        {charts.map((chart) => {
          const sourceLabel = METRIC_CONFIG[chart.key]?.sourceLabel || chart.unit;

          return (
            <div
              key={chart.key}
              className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-5 flex-1"
            >
              <div>
                <dt className="text-xs font-semibold text-slate-600">
                  {chart.title}
                </dt>
                <dd className="mt-1 text-xs text-slate-600">Source: {sourceLabel}</dd>
                <dd className="mt-2.5 text-2xl font-bold tracking-tight tabular-nums text-primary">
                  {formatChartValue(chart.total, chart.unit)}
                </dd>
              </div>

              <div className="mt-3.5 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                {chart.period}
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
