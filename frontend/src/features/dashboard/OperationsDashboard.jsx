import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RefreshCw,
  LayoutDashboard,
  ShieldCheck,
  AlertCircle,
  MapPin,
  Award,
  CalendarCheck,
} from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';
import { ROLE_BADGE_STYLES, ROLE_LABELS } from '../../utils/rbac';
import DashboardChart from './DashboardChart';
import DashboardKpis from './DashboardKpis';
import DashboardWorkQueue from './DashboardWorkQueue';
import { dashboardTitle, kpiCharts, orderedCharts } from './dashboardConfig';

function LoadingDashboard() {
  return (
    <div role="status" className="space-y-6 animate-pulse">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <span className="loading loading-spinner loading-xs text-[#0038A8]"></span>
        <span>Synchronizing Division Operational Records…</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="h-28 rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
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
            className="h-80 rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <div className="h-4 w-40 rounded bg-slate-200 mb-4" />
            <div className="h-56 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OperationsDashboard() {
  const { user } = useAuth();
  const client = useQueryClient();
  const tasksFetching = useIsFetching({ queryKey: [QUERY_KEYS.NOTIFICATIONS, user?.id, 'tasks'] });

  // 1. Unified Operational Dashboard Data from Backend
  const query = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_OPERATIONS, user?.id, user?.role],
    queryFn: ({ signal }) =>
      api.get('dashboard/operations/', { signal, timeout: 15000 }).then((response) => response.data),
    staleTime: 60000,
    retry: false,
  });

  // 2. Personal Employee Profile from Backend (if account has associated personnel record)
  const { data: meProfile } = useQuery({
    queryKey: ['me', user?.id],
    queryFn: () => api.get('employees/me/').then((res) => res.data).catch(() => null),
    staleTime: 60000,
    retry: false,
  });

  const charts = Array.isArray(query.data?.charts) ? query.data.charts : [];
  const primaryCharts = orderedCharts(charts, user);
  const summaryCharts = kpiCharts(charts, user);

  const roleBadgeStyle =
    user?.is_superuser
      ? 'bg-purple-50 text-purple-800 border-purple-200'
      : ROLE_BADGE_STYLES[user?.role] || 'bg-slate-100 text-slate-700 border-slate-200';
  const roleLabel =
    user?.is_superuser
      ? 'System Administrator'
      : ROLE_LABELS[user?.role] || user?.role || 'Staff Member';

  const isRefreshing = query.isFetching || tasksFetching > 0;

  const handleSyncAll = () => {
    query.refetch();
    client.invalidateQueries({ queryKey: ['me', user?.id] });
    client.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS, user?.id] });
  };

  const hasPersonalCredits =
    query.data?.scope === 'personal' &&
    meProfile &&
    (meProfile.vacation_leave_balance !== undefined || meProfile.sick_leave_balance !== undefined);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* DepEd Lucena City Institutional Cockpit Header */}
      <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-all">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#0038A8] font-mono">
                Department of Education • SDO Lucena City
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-[#0038A8] shadow-2xs">
                <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    {dashboardTitle(user)}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-bold ${roleBadgeStyle}`}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Personnel Metadata directly from Backend (no dummy fallbacks) */}
            <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-2 gap-y-1">
              {meProfile?.position && (
                <>
                  <span>
                    Plantilla Position: <strong className="font-semibold text-slate-800">{meProfile.position}</strong>
                  </span>
                  <span>•</span>
                </>
              )}
              {meProfile?.agency_employee_no && (
                <>
                  <span>
                    Agency ID: <strong className="font-mono text-slate-800">{meProfile.agency_employee_no}</strong>
                  </span>
                  <span>•</span>
                </>
              )}
              {meProfile?.department && (
                <>
                  <span>
                    Department: <span className="text-slate-700">{meProfile.department}</span>
                  </span>
                  <span>•</span>
                </>
              )}
              <span className="text-slate-500">
                {query.data?.scope === 'division' ? 'Division-Wide Administrative Scope' : 'Personal Personnel Scope'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
            {meProfile?.school_details?.name && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700">
                <MapPin className="h-4 w-4 text-[#0038A8] shrink-0" />
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-slate-500">Official Station</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px] block">
                    {meProfile.school_details.name}
                  </span>
                </div>
              </div>
            )}

            {meProfile?.salary_grade && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-700">
                <Award className="h-4 w-4 text-amber-600 shrink-0" />
                <div>
                  <span className="block text-[10px] uppercase font-semibold text-slate-500">Salary Grade</span>
                  <span className="font-mono font-bold text-slate-900">
                    SG {meProfile.salary_grade}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSyncAll}
              disabled={isRefreshing}
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#0038A8] disabled:opacity-60"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#0038A8]' : 'text-slate-500'}`}
                aria-hidden="true"
              />
              <span>{isRefreshing ? 'Synchronizing…' : 'Sync Records'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Real CSC Form No. 6 Leave Balances Strip from Backend (when viewing personal scope) */}
      {hasPersonalCredits && (
        <section aria-label="Personal leave credit balances" className="space-y-2">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4 text-[#0038A8]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              CSC Form No. 6 Recorded Credit Balances (Sec 7.B)
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Vacation Leave (VL)
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                  {Number(meProfile.vacation_leave_balance || 0).toFixed(3)}
                </span>
                <span className="text-xs text-slate-500">days</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Sick Leave (SL)
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                  {Number(meProfile.sick_leave_balance || 0).toFixed(3)}
                </span>
                <span className="text-xs text-slate-500">days</span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Total Available Credits
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold tabular-nums text-[#0038A8]">
                  {Number(meProfile.leave_balance ?? (Number(meProfile.vacation_leave_balance || 0) + Number(meProfile.sick_leave_balance || 0))).toFixed(3)}
                </span>
                <span className="text-xs text-slate-500">days</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {query.isPending ? (
        <LoadingDashboard />
      ) : query.isError ? (
        <section
          role="alert"
          className="rounded-xl border border-rose-200 bg-white p-6 shadow-xs"
        >
          <div className="flex items-center gap-2 text-rose-800 font-bold">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-base">Operations analytics unavailable</h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Recorded KPI figures could not be loaded from the division server. Your review docket below remains operational.
          </p>
          <button
            type="button"
            disabled={query.isFetching}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0038A8] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#0A225C] disabled:opacity-60"
            onClick={() => query.refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </button>
        </section>
      ) : (
        <>
          {summaryCharts.length > 0 && (
            <DashboardKpis charts={summaryCharts} asOf={query.data?.as_of} />
          )}

          <section aria-labelledby="dashboard-charts-title" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div>
                <h2
                  id="dashboard-charts-title"
                  className="text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Operational Distributions & Activity Series
                </h2>
                <p className="text-[11px] text-slate-500">
                  Aggregated plantillas, dockets, and fiscal histories matching this account
                </p>
              </div>
            </div>

            {primaryCharts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-600 shadow-xs">
                <p className="font-semibold text-slate-800">No registered data in current view</p>
                <p className="mt-1">
                  Once records are recorded in the official modules, interactive pipeline breakdowns will display here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {primaryCharts.map((chart, index) => (
                  <div
                    key={chart.key}
                    className={index === 0 ? 'min-w-0 lg:col-span-2' : 'min-w-0'}
                  >
                    <DashboardChart chart={chart} userId={user?.id} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Review Docket & Operational Navigation */}
      <DashboardWorkQueue user={user} />
    </div>
  );
}
