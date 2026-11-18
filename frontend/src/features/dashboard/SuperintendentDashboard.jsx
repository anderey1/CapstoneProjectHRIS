import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileBarChart,
  ClipboardList,
  PieChart as PieChartIcon,
  BarChart3,
  Loader2,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const CHART_COLORS = ['#0038A8', '#0A225C', '#15803D', '#B45309', '#0284C7'];

const SuperintendentDashboard = ({ stats }) => {
  const { data: perfData, isLoading: perfLoading, isError: perfError } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.PERFORMANCE],
    queryFn: () => api.get('analytics/performance/').then((res) => res.data),
    staleTime: 60000,
  });

  const { data: attendanceData, isLoading: attLoading, isError: attError } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.ATTENDANCE_TRENDS],
    queryFn: () => api.get('analytics/attendance/').then((res) => res.data),
    staleTime: 60000,
  });

  const formattedPerf =
    perfData?.map((item) => ({
      name: item.is_promotion_eligible ? 'Promotion Eligible' : 'Regular Rating',
      value: item.count,
    })) || [];

  const formattedAtt =
    attendanceData?.map((item) => ({
      name: item.status?.toUpperCase() || 'UNKNOWN',
      count: item.count,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Loan Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Loan Approvals
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
              {stats?.pending_loan_approvals ?? 0}
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Awaiting SDS
            </span>
          </div>
          <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Provident Fund final sign-offs
          </p>
        </div>

        {/* Card 2: Leave Pipeline */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Leave Decisions
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-[#0038A8]">
              <ClipboardList className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
              {stats?.pending_leaves ?? 0}
            </span>
            <span className="text-xs font-semibold text-[#0038A8] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
              <Clock className="w-3 h-3" />
              In Pipeline
            </span>
          </div>
          <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            CSC Form No. 6 applications
          </p>
        </div>

        {/* Card 3: IPCRF Reviews */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              IPCRF Portfolios
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-purple-700">
              <FileBarChart className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
              {stats?.pending_ipcrf ?? 0}
            </span>
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
              Unrated Staff
            </span>
          </div>
          <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            RPMS compliance coverage
          </p>
        </div>

        {/* Card 4: Attendance Policy Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              DTR Pending Review
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
              {stats?.attendance_alerts ?? 0}
            </span>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
              Exceptions
            </span>
          </div>
          <p className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Unapproved daily records
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-[#0038A8]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Performance Rating Mix (RPMS / IPCRF)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">Division Overview</span>
            </div>

            <div className="h-[260px] w-full relative">
              {perfLoading ? (
                <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0038A8]" />
                  <span className="text-xs">Loading performance data…</span>
                </div>
              ) : perfError ? (
                <div className="h-full flex items-center justify-center text-rose-600 text-xs gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Unable to load performance metrics</span>
                </div>
              ) : formattedPerf.length > 0 ? (
                <>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Rated
                    </span>
                    <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
                      {formattedPerf.reduce((acc, curr) => acc + curr.value, 0)}
                    </span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={formattedPerf}
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {formattedPerf.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '0.5rem',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No submitted IPCRF evaluations found for the active cycle.
                </div>
              )}
            </div>
          </div>

          {/* Performance Legend */}
          <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            {formattedPerf.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0038A8]" />
                <h3 className="text-sm font-bold text-slate-900">
                  Attendance Status Distribution
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">CSC Form 48 Stream</span>
            </div>

            <div className="h-[260px] w-full">
              {attLoading ? (
                <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#0038A8]" />
                  <span className="text-xs">Loading attendance data…</span>
                </div>
              ) : attError ? (
                <div className="h-full flex items-center justify-center text-rose-600 text-xs gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Unable to load attendance records</span>
                </div>
              ) : formattedAtt.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={formattedAtt} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                      {formattedAtt.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No attendance logs recorded for the selected records.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Operational Continuity:</span> Attendance status distribution from imported biometrics and staff DTR records.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperintendentDashboard;
