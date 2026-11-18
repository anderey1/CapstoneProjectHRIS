import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, RotateCw, Sparkles } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import {
  DE_PED_PALETTE,
  formatAxisValue,
  formatChartValue,
  METRIC_CONFIG,
  truncateLabel,
} from './dashboardConfig';

const GRID_COLOR = '#e2e8f0';

function EmptyChart({ chart }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <p className="font-medium text-slate-900">No records in this view yet.</p>
      <p className="mt-2 text-sm text-slate-600">{chart.insight}</p>
    </div>
  );
}

function ChartPlot({ chart }) {
  const rows = Array.isArray(chart.data) ? chart.data : [];
  if (!rows.length) return <EmptyChart chart={chart} />;

  const data = rows.map((item) => ({
    name: item.name,
    value: Number(item.value),
    label: formatChartValue(item.value, chart.unit),
  }));
  const isTrend = chart.key === 'payroll' || chart.unit === 'PHP';
  const height = isTrend ? 240 : Math.max(220, data.length * 34 + 32);
  const tooltipFormatter = (value) => [
    formatChartValue(value, chart.unit),
    chart.unit === 'PHP' ? 'Amount' : chart.unit,
  ];

  if (isTrend) {
    const gradientId = `trendGradient-${chart.key}`;
    return (
      <div className="h-60 min-w-0" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0038A8" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#0038A8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID_COLOR} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
            <YAxis
              width={62}
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={formatAxisValue}
            />
            <Tooltip formatter={tooltipFormatter} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0038A8"
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              dot={{ r: 4, fill: '#0038A8' }}
              activeDot={{ r: 6, fill: '#0038A8' }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="min-w-0" style={{ height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
          barCategoryGap="28%"
        >
          <CartesianGrid horizontal={false} stroke={GRID_COLOR} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={formatAxisValue}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={132}
            interval={0}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={truncateLabel}
          />
          <Tooltip formatter={tooltipFormatter} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={DE_PED_PALETTE[index % DE_PED_PALETTE.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DataTable({ chart }) {
  const rows = Array.isArray(chart.data) ? chart.data : [];
  return (
    <table className="sr-only">
      <caption>{chart.title} values</caption>
      <thead>
        <tr>
          <th scope="col">Category</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <th scope="row">{row.name}</th>
            <td>{formatChartValue(row.value, chart.unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChartExplanation({ chart, userId }) {
  const summary = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_INSIGHT, userId, chart.key, chart.data],
    queryFn: ({ signal }) =>
      api
        .get(`dashboard/operations/insight/${chart.key}/`, { signal })
        .then((response) => response.data),
    enabled: false,
    retry: false,
    staleTime: 900000,
  });

  return (
    <details className="group border-t border-slate-200/80 pt-1">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between py-2 text-xs font-semibold text-slate-600 hover:text-primary transition-colors select-none">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
          <span>Optional explanation</span>
        </span>
        <span className="text-[10px] text-slate-400 group-open:rotate-180 transition-transform">
          ▼
        </span>
      </summary>
      <div className="pb-3 pt-1 space-y-2.5">
        <button
          type="button"
          onClick={() => summary.refetch()}
          disabled={summary.isFetching}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 transition-all"
        >
          {summary.isFetching ? (
            <>
              <RotateCw className="h-3 w-3 animate-spin text-primary" aria-hidden="true" />
              <span>Generating…</span>
            </>
          ) : summary.data?.source === 'ai' ? (
            <>
              <RotateCw className="h-3 w-3 text-slate-500" aria-hidden="true" />
              <span>Regenerate AI explanation</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 text-amber-500" aria-hidden="true" />
              <span>Explain with AI</span>
            </>
          )}
        </button>
        <div aria-live="polite">
          {summary.isError && (
            <div className="rounded-lg bg-red-50 p-3 border border-red-200/70">
              <p className="text-xs font-medium text-error flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>AI explanation could not load. Try again; the figures above remain available.</span>
              </p>
            </div>
          )}
          {summary.data && (
            <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                  {summary.data.source === 'ai'
                    ? 'AI-generated explanation: verify against the figures'
                    : 'Data-based explanation'}
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-slate-700">
                {summary.data.message || summary.data.text}
              </p>
              {summary.data.source === 'ai' && (
                <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/50">
                  Supports interpretation; it does not approve applications or establish compliance.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

export default function DashboardChart({ chart, userId }) {
  const titleId = useId();
  const rows = Array.isArray(chart.data) ? chart.data : [];
  const cfg = METRIC_CONFIG[chart.key];
  const Icon = cfg?.icon;

  return (
    <section
      aria-labelledby={titleId}
      aria-label={chart.title}
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${cfg.bg} ${cfg.border} ${cfg.color}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <h3 id={titleId} className="text-base font-semibold text-slate-900">
              {chart.title}
            </h3>
            <p className="mt-1 text-xs text-slate-600">{chart.period}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600">
          {chart.unit === 'PHP' ? 'PHP' : chart.unit}
        </span>
      </header>

      <div className="flex min-w-0 flex-1 flex-col px-5 py-5">
        <figure className="m-0 min-w-0">
          <ChartPlot chart={chart} />
          <DataTable chart={chart} />
        </figure>

        <p className="mt-4 text-sm leading-relaxed text-slate-900">{chart.insight}</p>
        <p className="mt-2 text-xs leading-relaxed text-slate-600">{chart.note}</p>

        {chart.key === 'payroll' && rows.length > 0 && (
          <details className="mt-2 border-t border-slate-200 pt-1">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-primary">
              View monthly figures
            </summary>
            <ul className="space-y-2 py-2">
              {rows.map((item) => (
                <li
                  key={item.name}
                  className="flex justify-between gap-3 text-sm text-slate-700"
                >
                  <span>{item.name}</span>
                  <span className="tabular-nums font-mono">
                    {formatChartValue(item.value, chart.unit)}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="mt-auto pt-2">
          <ChartExplanation chart={chart} userId={userId} />
        </div>
      </div>
    </section>
  );
}
