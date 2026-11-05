import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#0038a8', '#0a225c', '#15803d', '#b45309', '#475569', '#0284c7'];
const valueLabel = (value, unit) => unit === 'PHP'
  ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(value))
  : Number(value).toLocaleString();

function Chart({ chart }) {
  const max = Math.max(...chart.data.map(item => Number(item.value)), 1);
  if (!chart.data.length || (!Number(chart.total) && chart.unit !== 'PHP')) return <div className="flex min-h-40 items-center justify-center rounded bg-slate-50 p-6 text-sm text-slate-600">No records available for this view.</div>;
  if (chart.key === 'payroll') return <div className="h-64 min-w-0" role="img" aria-label={chart.insight}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chart.data.map(item => ({ ...item, value: Number(item.value) }))} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis width={65} tick={{ fontSize: 12 }} tickLine={false} tickFormatter={value => `${Number(value / 1000).toLocaleString()}k`} />
        <Tooltip formatter={value => [valueLabel(value, 'PHP'), 'Released net pay']} />
        <Line dataKey="value" name="Released net pay" stroke={COLORS[0]} strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
  if (chart.key === 'workforce') return <div className="flex flex-col items-center gap-4 sm:flex-row">
    <div className="h-52 w-52 shrink-0" role="img" aria-label={chart.insight}>
      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chart.data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} isAnimationActive={false}>{chart.data.map((item, i) => <Cell key={item.name} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
    </div>
    <ul className="w-full space-y-3 text-sm">{chart.data.map((item, i) => <li key={item.name} className="flex items-start justify-between gap-3"><span className="flex items-start gap-2 text-slate-600"><span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />{item.name}</span><strong className="tabular-nums text-slate-900">{valueLabel(item.value, chart.unit)}</strong></li>)}</ul>
  </div>;
  return <ul className="space-y-4" aria-label={`${chart.title}, ${chart.unit}`}>
    {chart.data.map((item, i) => <li key={item.name}>
      <div className="mb-1.5 flex items-start justify-between gap-4 text-sm"><span className="text-slate-700">{item.name}</span><span className="shrink-0 font-semibold tabular-nums text-slate-900">{valueLabel(item.value, chart.unit)}</span></div>
      <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-sm bg-slate-100"><div className="h-full rounded-sm" style={{ width: `${Number(item.value) / max * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} /></div>
    </li>)}
  </ul>;
}

function AnalyticsCard({ chart, userId }) {
  const titleId = useId();
  const summary = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_INSIGHT, userId, chart.key, chart.data],
    queryFn: ({ signal }) => api.get(`dashboard/operations/insight/${chart.key}/`, { signal }).then(response => response.data),
    enabled: false, retry: false, staleTime: 900000,
  });
  return <section aria-labelledby={titleId} className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
    <header className="mb-5 flex items-start justify-between gap-3">
      <div><h2 id={titleId} className="text-base font-semibold text-slate-900">{chart.title}</h2><p className="mt-1 text-xs text-slate-600">{chart.period}</p></div>
      <span className="shrink-0 text-xs text-slate-600">{chart.unit === 'PHP' ? 'PHP' : chart.unit}</span>
    </header>
    <Chart chart={chart} />
    {chart.key === 'payroll' && chart.data.length > 0 && <details className="mt-3 text-sm text-slate-600"><summary className="cursor-pointer py-2 font-medium text-[#0038a8]">View monthly figures</summary><ul className="space-y-2 py-2">{chart.data.map(item => <li key={item.name} className="flex justify-between gap-3"><span>{item.name}</span><span className="tabular-nums">{valueLabel(item.value, chart.unit)}</span></li>)}</ul></details>}
    <div className="mt-5 border-t border-slate-200 pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">What this shows</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-900">{chart.insight}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">{chart.note}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4">
        <Link to={chart.path} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-[#0038a8] underline-offset-4 hover:underline focus-visible:outline-2">{chart.action}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        <button type="button" onClick={() => summary.refetch()} disabled={summary.isFetching} className="inline-flex min-h-11 items-center gap-2 text-sm text-slate-600 hover:text-[#0038a8] focus-visible:outline-2 disabled:opacity-60"><Sparkles className="h-4 w-4" aria-hidden="true" />{summary.isFetching ? 'Generating…' : summary.data?.source === 'ai' ? 'Regenerate AI explanation' : 'Explain with AI'}</button>
      </div>
      <div aria-live="polite">
        {summary.isError && <p className="mt-2 text-sm text-error">AI explanation could not load. Try again; the figures above remain available.</p>}
        {summary.data && <div className="mt-3 rounded border border-blue-100 bg-blue-50/50 p-3"><h3 className="text-xs font-semibold text-[#0038a8]">{summary.data.source === 'ai' ? 'AI-generated explanation — verify against the figures' : 'Data-based explanation'}</h3><p className="mt-1 text-sm leading-relaxed text-slate-700">{summary.data.message || summary.data.text}</p>{summary.data.source === 'ai' && <p className="mt-1 text-xs text-slate-600">Supports interpretation; it does not approve applications or establish compliance.</p>}</div>}
      </div>
    </div>
  </section>;
}

export default function OperationsDashboard() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: [QUERY_KEYS.DASHBOARD_OPERATIONS, user?.id, user?.role], queryFn: ({ signal }) => api.get('dashboard/operations/', { signal, timeout: 15000 }).then(response => response.data), staleTime: 60000, retry: false });
  const titles = { ACCOUNTANT: 'Finance dashboard', SUPERINTENDENT: 'Division operations dashboard', HR: 'HR operations dashboard', ADMINISTRATIVE: 'Administrative operations dashboard' };
  if (query.isPending) return <div role="status" className="p-8 text-sm text-slate-600">Loading dashboard analytics…</div>;
  if (query.isError) return <div role="alert" className="m-6 rounded border border-red-200 bg-white p-6"><h1 className="font-semibold text-slate-900">Dashboard could not load</h1><p className="mt-2 text-sm text-slate-600">Your records have not changed. Retry to load the analytics.</p><button type="button" className="btn bg-[#0038a8] text-white mt-4" onClick={() => query.refetch()}>Retry</button></div>;
  const data = query.data;
  const summaryKeys = data.scope === 'personal' ? ['attendance', 'leaves', 'loans', 'performance'] : user.role === 'ACCOUNTANT' ? ['payroll', 'payroll_status', 'loans'] : ['workforce', 'leaves', 'loans', 'recruitment'];
  return <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
    <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
      <div><p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#0038a8]">{data.scope === 'personal' ? 'Employee self-service' : 'Business operations'}</p><h1 className="text-2xl font-semibold tracking-tight text-slate-900">{titles[user.role] || 'My dashboard'}</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">{data.scope === 'personal' ? 'Understand your attendance, applications, payslips, and performance records.' : 'See the current workload, understand each measure, and open the records that need review.'}</p><p className="mt-2 text-xs text-slate-600">Updated {new Date(data.as_of).toLocaleString()} · Each chart states its reporting period.</p></div>
      <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded border border-slate-300 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-2 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${query.isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />{query.isFetching ? 'Refreshing…' : 'Refresh data'}</button>
    </header>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{summaryKeys.map(key => data.charts.find(chart => chart.key === key)).filter(Boolean).map(chart => <Link key={chart.key} to={chart.path} className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 hover:border-blue-400 focus-visible:outline-2"><p className="text-sm text-slate-600">{chart.title}</p><p className="mt-3 break-words text-2xl font-semibold tabular-nums text-slate-900">{valueLabel(chart.total, chart.unit)}</p><p className="mt-2 text-xs text-slate-600">{chart.unit === 'PHP' ? chart.period : chart.unit + ' · ' + chart.period}</p></Link>)}</div>
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">{data.charts.map(chart => <AnalyticsCard key={chart.key} chart={chart} userId={user.id} />)}</div>
  </div>;
}
