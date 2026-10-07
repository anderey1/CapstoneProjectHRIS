import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import {
  Users,
  CalendarCheck,
  AlertCircle,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  School,
  ArrowRight,
  BadgeAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

const CHART_PRIMARY = '#0038A8'; // DepEd Blue
const CHART_SECONDARY = '#475569'; // Slate 600
const CHART_ACCENT = '#D97706'; // Amber 600

const PIE_COLORS = [CHART_PRIMARY, CHART_SECONDARY, CHART_ACCENT];

const LEAVE_TYPE_LABELS = {
  vacation: 'Vacation Leave',
  'vacation leave': 'Vacation Leave',
  forced: 'Mandatory/Forced Leave',
  'mandatory/forced leave': 'Mandatory/Forced Leave',
  sick: 'Sick Leave',
  'sick leave': 'Sick Leave',
  maternity: 'Maternity Leave',
  'maternity leave': 'Maternity Leave',
  paternity: 'Paternity Leave',
  'paternity leave': 'Paternity Leave',
  special_privilege: 'Special Privilege Leave',
  'special privilege leave': 'Special Privilege Leave',
  solo_parent: 'Solo Parent Leave',
  'solo parent leave': 'Solo Parent Leave',
  study: 'Study Leave',
  'study leave': 'Study Leave',
  vawc: '10-Day VAWC Leave',
  rehabilitation: 'Rehabilitation Privilege',
  women_special: 'Special Leave for Women',
  emergency: 'Calamity Leave',
  adoption: 'Adoption Leave',
  others: 'Others',
};

const AdminDashboard = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS],
    queryFn: () => api.get('dashboard/').then((res) => res.data),
  });

  const { data: recruitmentData } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.RECRUITMENT],
    queryFn: () => api.get('analytics/recruitment/').then((res) => res.data),
  });

  const { data: leaveTypeData } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.LEAVE_TYPES],
    queryFn: () => api.get('analytics/leave/').then((res) => res.data),
  });

  const { data: schoolsData } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.SCHOOLS],
    queryFn: () => api.get('analytics/schools/').then((res) => res.data),
  });

  const isLoading = statsLoading;

  const formattedSchoolsData = useMemo(() => {
    return (schoolsData || stats?.schools_breakdown || []).map((item) => ({
      name: item.name,
      count: item.count ?? item.employee_count ?? 0,
    }));
  }, [schoolsData, stats]);

  const staffMixData = useMemo(() => {
    return [
      { name: 'Teaching Faculty', value: stats?.teaching_count || 0 },
      { name: 'Non-Teaching', value: stats?.non_teaching_count || 0 },
      { name: 'Administrative Staff', value: stats?.administrative_count || 0 },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const formattedTeachingLeaves = useMemo(() => {
    return (
      leaveTypeData?.teaching?.map((item) => ({
        name:
          LEAVE_TYPE_LABELS[item.leave_type?.toLowerCase()] ||
          item.leave_type?.toUpperCase() ||
          'Other',
        value: Number(item.count) || 0,
      })) || []
    );
  }, [leaveTypeData]);

  const formattedNonTeachingLeaves = useMemo(() => {
    return (
      leaveTypeData?.non_teaching?.map((item) => ({
        name:
          LEAVE_TYPE_LABELS[item.leave_type?.toLowerCase()] ||
          item.leave_type?.toUpperCase() ||
          'Other',
        value: Number(item.count) || 0,
      })) || []
    );
  }, [leaveTypeData]);

  const formattedRecData = useMemo(() => {
    return (
      recruitmentData?.map((item) => ({
        name: item.status?.replace(/[_-]+/g, ' ').toUpperCase() || 'STAGE',
        count: item.count,
      })) || []
    );
  }, [recruitmentData]);

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col justify-center h-[60vh] items-center space-y-3">
        <span className="loading loading-spinner loading-lg text-[#0038A8]"></span>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Loading Division Executive Cockpit...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* DepEd Institutional Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Republic of the Philippines • Department of Education • SDO Lucena City
          </span>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[#0038A8]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Division Administrative Cockpit
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Schools Division Superintendent &amp; HR Executive Decision Operations Center
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            5 Stations Operational
          </span>
        </div>
      </div>

      {/* 4-Metric Institutional Status Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Plantilla Headcount */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Plantilla Headcount
            </span>
            <Users className="w-4 h-4 text-[#0038A8]" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.total_employees || 0}
            </span>
            <span className="text-xs text-slate-500">personnel</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
            <span>{stats?.teaching_count || 0} Teach</span>
            <span>•</span>
            <span>{stats?.non_teaching_count || 0} Non-T</span>
            <span>•</span>
            <span>{stats?.administrative_count || 0} Admin</span>
          </div>
        </div>

        {/* Metric 2: Cluster Stations */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Cluster Schools
            </span>
            <School className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formattedSchoolsData.length || 5}
            </span>
            <span className="text-xs text-slate-500">active stations</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2 truncate">
            South 1, West 1, North 1, East 1, LCNHS
          </span>
        </div>

        {/* Metric 3: Attendance & Geofence Compliance */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Geofence Compliance
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {stats?.geo_compliance_rate || 100}%
            </span>
            <span className="text-xs text-slate-500">verified</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
            <span>150m GPS radius</span>
            <span
              className={`font-semibold ${
                (stats?.attendance_alerts || 0) > 0 ? 'text-amber-700' : 'text-slate-500'
              }`}
            >
              {stats?.attendance_alerts || 0} flagged alert(s)
            </span>
          </div>
        </div>

        {/* Metric 4: Action Queue */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Action Queue
            </span>
            <BadgeAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              {stats?.pending_action_total || 0}
            </span>
            <span className="text-xs text-slate-500">awaiting review</span>
          </div>
          <span className="text-[11px] text-slate-600 block mt-2 truncate font-mono">
            {stats?.pending_leaves || 0} Lvs •{' '}
            {(stats?.pending_loan_approvals || 0) + (stats?.pending_loan_verification || 0)} Lns •{' '}
            {stats?.pending_payroll_approval || 0} Pay
          </span>
        </div>
      </div>

      {/* Immediate Action Alerts Docket */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#0038A8]" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              High-Priority Action Docket
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">Division Approval Pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* CSC Form 6 Pending Docket */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-slate-800 block">CSC Form No. 6 Leaves</span>
              <p className="text-[11px] text-slate-500">
                {stats?.pending_leaves_supervisor || 0} Supervisor • {stats?.pending_leaves_hr || 0} HR •{' '}
                {stats?.pending_leaves_superintendent || 0} SDS
              </p>
            </div>
            <Link
              to="/leaves"
              className="inline-flex items-center gap-1 text-[#0038A8] font-semibold hover:underline text-[11px]"
            >
              Docket <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Provident Fund Pending Docket */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-slate-800 block">Provident Fund Loans</span>
              <p className="text-[11px] text-slate-500">
                {stats?.pending_loan_verification || 0} to Verify •{' '}
                {stats?.pending_loan_approvals || 0} to Endorse
              </p>
            </div>
            <Link
              to="/loans"
              className="inline-flex items-center gap-1 text-[#0038A8] font-semibold hover:underline text-[11px]"
            >
              Review <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Payroll Pending Docket */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-semibold text-slate-800 block">Payroll Disbursement</span>
              <p className="text-[11px] text-slate-500">
                {stats?.pending_payroll_approval || 0} Draft • {stats?.ready_for_release || 0} Ready
              </p>
            </div>
            <Link
              to="/payroll"
              className="inline-flex items-center gap-1 text-[#0038A8] font-semibold hover:underline text-[11px]"
            >
              Process <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Visual Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Station Deployment & Leave Allocations (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Station Deployment Table & Chart */}
          <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-[#0038A8]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Personnel Deployment Across Cluster Stations
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Division Roster</span>
            </div>

            <div className="h-[240px] w-full">
              {formattedSchoolsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={formattedSchoolsData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#475569' }}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0, 56, 168, 0.05)' }}
                      contentStyle={{
                        borderRadius: '0.375rem',
                        border: '1px solid #CBD5E1',
                        fontSize: '11px',
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                    <Bar dataKey="count" fill={CHART_PRIMARY} radius={[2, 2, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  No cluster station records
                </div>
              )}
            </div>

            {/* Station Breakdown Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-slate-100 text-xs">
              {formattedSchoolsData.map((s, idx) => (
                <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded text-center">
                  <span className="text-[10px] text-slate-500 block truncate">{s.name}</span>
                  <strong className="font-mono tabular-nums text-slate-900 font-bold block mt-0.5">
                    {s.count}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Civil Service Leave Allocations Breakdown */}
          <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#0038A8]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Civil Service Form No. 6 Leave Distribution
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Most Used: {stats?.most_used_leave || 'None'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Teaching Leaves */}
              <div className="border border-slate-200 rounded-md p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-800 border-b border-slate-200 pb-1">
                  <span>Teaching Faculty Leaves</span>
                  <span className="font-mono tabular-nums text-[#0038A8]">
                    {formattedTeachingLeaves.reduce((a, c) => a + c.value, 0)} requests
                  </span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {formattedTeachingLeaves.length > 0 ? (
                    formattedTeachingLeaves.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]"
                      >
                        <span className="text-slate-700 truncate">{item.name}</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          {item.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4 text-xs">No teaching leaves</p>
                  )}
                </div>
              </div>

              {/* Non-Teaching Leaves */}
              <div className="border border-slate-200 rounded-md p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between font-semibold text-slate-800 border-b border-slate-200 pb-1">
                  <span>Non-Teaching Staff Leaves</span>
                  <span className="font-mono tabular-nums text-slate-700">
                    {formattedNonTeachingLeaves.reduce((a, c) => a + c.value, 0)} requests
                  </span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {formattedNonTeachingLeaves.length > 0 ? (
                    formattedNonTeachingLeaves.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]"
                      >
                        <span className="text-slate-700 truncate">{item.name}</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          {item.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center py-4 text-xs">No non-teaching leaves</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Staff Composition & Recruitment Funnel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Workforce Composition Donut */}
          <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0038A8]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Workforce Composition
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Staff Mix</span>
            </div>

            <div className="h-[180px] w-full relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total
                </span>
                <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                  {stats?.total_employees || 0}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={staffMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {staffMixData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.375rem',
                      border: '1px solid #CBD5E1',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#0038A8]" />
                  Teaching Faculty
                </span>
                <strong className="font-mono tabular-nums text-slate-900">
                  {stats?.teaching_count || 0}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#475569]" />
                  Non-Teaching Personnel
                </span>
                <strong className="font-mono tabular-nums text-slate-900">
                  {stats?.non_teaching_count || 0}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706]" />
                  Administrative Staff
                </span>
                <strong className="font-mono tabular-nums text-slate-900">
                  {stats?.administrative_count || 0}
                </strong>
              </div>
            </div>
          </div>

          {/* RQA Recruitment Funnel */}
          <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#0038A8]" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  RQA Applicant Funnel
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {stats?.active_applicants || 0} Active
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {formattedRecData.length > 0 ? (
                formattedRecData.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded"
                  >
                    <span className="text-[11px] font-medium text-slate-700">{item.name}</span>
                    <span className="font-mono tabular-nums font-bold text-[#0038A8]">
                      {item.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-4 text-xs">No applicant records</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
