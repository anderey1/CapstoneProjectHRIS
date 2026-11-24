import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, RotateCw, Table2 } from 'lucide-react';
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
  CHART_COLORS,
  formatAxisValue,
  formatChartValue,
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
                <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.18} />
                <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
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
              stroke={CHART_COLORS[0]}
              strokeWidth={3}
              fill={`url(#${gradientId})`}
              dot={{ r: 4, fill: CHART_COLORS[0] }}
              activeDot={{ r: 6, fill: CHART_COLORS[0] }}
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
                fill={CHART_COLORS[index % CHART_COLORS.length]}
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

function ChartExplanation({ chart, userId, hasData }) {
  const summary = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_INSIGHT, userId, chart.key, chart.data],
    queryFn: ({ signal }) =>
      api
        .get(`dashboard/operations/insight/${chart.key}/`, { signal })
        .then((response) => response.data),
    enabled: hasData,
    retry: false,
    staleTime: 900000,
  });

  const isAi = summary.data?.source === 'ai';
  const isLoading = summary.isFetching && !summary.data;
  const detail = summary.isError
    ? 'AI explanation could not load. The figures above remain available.'
    : isAi
      ? 'Interpretation only. Check it against the figures above.'
      : summary.data?.message;
  const sourceLabel = isAi ? 'AI generated' : isLoading ? null : 'From recorded figures';

  return (
    <section
      aria-label={`${chart.title} explanation`}
      aria-live="polite"
      className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
    >
      <div>
        <h4 className="text-xs font-semibold text-slate-900">Chart explanation</h4>
        {sourceLabel && (
          <p className="mt-1 text-xs font-medium text-slate-600">
            Source: {sourceLabel}
          </p>
        )}
      </div>

      {isLoading ? (
        <div role="status" className="mt-2 flex min-h-12 items-center gap-2 text-xs text-slate-600">
          <RotateCw className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
          <span>Reading this chart…</span>
        </div>
      ) : (
        <div className="mt-2 space-y-2">
          <p className="text-sm leading-relaxed text-slate-800">
            {summary.data?.text || chart.insight}
          </p>
          {chart.note && (
            <p className="text-xs leading-relaxed text-slate-600">{chart.note}</p>
          )}
          {detail && (
            <p className="border-t border-slate-200 pt-2 text-xs leading-relaxed text-slate-600">
              {detail}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

export default function DashboardChart({ chart, userId }) {
  const titleId = useId();
  const rows = Array.isArray(chart.data) ? chart.data : [];

  return (
    <section
      aria-labelledby={titleId}
      aria-label={chart.title}
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <h3 id={titleId} className="text-base font-semibold text-slate-900">
            {chart.title}
          </h3>
          <p className="mt-1 text-xs text-slate-600">{chart.period}</p>
        </div>
        <span className="shrink-0 text-xs font-medium text-slate-600">
          Measured in {chart.unit}
        </span>
      </header>

      <div className="flex min-w-0 flex-1 flex-col px-5 py-5">
        <figure className="m-0 min-w-0">
          <ChartPlot chart={chart} />
          {!(chart.key === 'payroll' && rows.length > 0) && <DataTable chart={chart} />}
        </figure>

        <ChartExplanation chart={chart} userId={userId} hasData={rows.length > 0} />

        {chart.key === 'payroll' && rows.length > 0 && (
          <details className="group mt-4 border-t border-slate-200">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 py-3 text-sm font-medium text-primary hover:text-secondary focus-visible:outline-2 focus-visible:outline-primary">
              <span className="inline-flex min-w-0 items-center gap-2">
                <Table2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                View monthly figures
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 text-xs font-normal text-slate-600">
                {rows.length} months
                <ChevronDown className="h-4 w-4 transition-transform motion-reduce:transition-none group-open:rotate-180" aria-hidden="true" />
              </span>
            </summary>
            <div className="mb-1 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <caption className="sr-only">Released net pay by month</caption>
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left">Month</th>
                    <th scope="col" className="px-3 py-2 text-right">Net pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {rows.map((item, index) => (
                    <tr key={item.name} className={index === rows.length - 1 ? 'bg-blue-50/60' : undefined}>
                      <th scope="row" className="px-3 py-2 text-left font-normal text-slate-700">
                        {item.name}
                        {index === rows.length - 1 && (
                          <span className="ml-2 text-xs font-semibold text-primary">Latest</span>
                        )}
                      </th>
                      <td className="px-3 py-2 text-right font-medium tabular-nums text-slate-900">
                        {formatChartValue(item.value, chart.unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-300 bg-slate-50">
                  <tr>
                    <th scope="row" className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Total shown</th>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-primary">
                      {formatChartValue(chart.total, chart.unit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
