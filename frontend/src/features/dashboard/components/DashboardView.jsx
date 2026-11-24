import { useAuth } from '../../../context/AuthContext';
import DashboardChart from '../DashboardChart';
import DashboardKpis from '../DashboardKpis';
import useDashboardOperations from '../hooks/useDashboardOperations';
import DashboardHeader from './DashboardHeader';
import { DashboardError, LoadingDashboard } from './DashboardStates';
import PersonalLeaveCredits from './PersonalLeaveCredits';

export default function DashboardView({ title }) {
  const { user } = useAuth();
  const {
    query,
    meProfile,
    charts,
    roleLabel,
    isRefreshing,
    refresh,
    hasPersonalCredits,
  } = useDashboardOperations(user);

  const summaryKeys = Array.isArray(query.data?.kpi_keys) ? query.data.kpi_keys : [];
  const primaryCharts = charts;
  const summaryCharts = summaryKeys.map(key => charts.find(chart => chart.key === key)).filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl space-y-9 p-4 sm:p-6 lg:p-8">
      {/* DepEd Lucena City Institutional Cockpit Header */}
      <DashboardHeader
        title={title}
        roleLabel={roleLabel}
        scope={query.data?.scope}
        asOf={query.data?.as_of}
        isRefreshing={isRefreshing}
        onRefresh={refresh}
      />

      {/* Real CSC Form No. 6 Leave Balances Strip from Backend (when viewing personal scope) */}
      {hasPersonalCredits && <PersonalLeaveCredits meProfile={meProfile} />}

      {query.isPending ? (
        <LoadingDashboard />
      ) : query.isError ? (
        <DashboardError onRetry={query.refetch} isFetching={query.isFetching} />
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
                  className="text-xs font-semibold text-slate-600"
                >
                  Role-specific charts
                </h2>
                <p className="text-xs text-slate-600">
                  Figures from the records available to this account
                </p>
              </div>
            </div>

            {primaryCharts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-600">
                <p className="font-semibold text-slate-800">No chart records are available for this account yet.</p>
                <p className="mt-1">
                  No chart data is available for this account. Refresh after the relevant records are entered.
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
    </div>
  );
}
