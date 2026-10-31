import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import {
  Wallet,
  CalendarCheck,
  Clock,
  Award,
  ShieldCheck,
  MapPin,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Employee Dashboard (DepEd Division Workstation Portal)
 * High-density utilitarian workstation for teaching and non-teaching personnel.
 */
const EmployeeDashboard = () => {
  // 1. Data Fetching
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('employees/me/').then((res) => res.data),
  });

  const { data: attendance = [] } = useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE],
    queryFn: () =>
      api.get('attendance/').then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        return data.slice(0, 5);
      }),
  });

  const { data: loans = [] } = useQuery({
    queryKey: [QUERY_KEYS.LOANS],
    queryFn: () =>
      api.get('loans/').then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data.results || [];
        return data;
      }),
  });

  const { data: payrolls = [] } = useQuery({
    queryKey: [QUERY_KEYS.PAYROLL],
    queryFn: () =>
      api.get('payroll/').then((res) =>
        Array.isArray(res.data) ? res.data : res.data.results || []
      ),
  });

  // Derived Values
  const latestPayroll = useMemo(() => {
    return payrolls && payrolls.length > 0 ? payrolls[0] : null;
  }, [payrolls]);

  const activeLoans = useMemo(() => {
    return loans.filter((l) => ['released', 'approved', 'verified'].includes(l.status));
  }, [loans]);

  if (meLoading) {
    return (
      <div className="p-8 flex flex-col justify-center h-[60vh] items-center space-y-3">
        <span className="loading loading-spinner loading-lg text-[#0038A8]"></span>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Loading Employee Workstation...
        </p>
      </div>
    );
  }

  const vlBalance = Number(me?.vacation_leave_balance ?? 15);
  const slBalance = Number(me?.sick_leave_balance ?? 15);
  const totalLeaveCredits = Number(me?.leave_balance ?? vlBalance + slBalance);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* DepEd Calm Institutional Header */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Department of Education • SDO Lucena City • Personnel Portal
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {me?.first_name} {me?.last_name}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Active in Service
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Plantilla Item:{' '}
              <strong className="font-semibold text-slate-800">{me?.position || 'Teacher I'}</strong> •{' '}
              {me?.department || 'Department of Education'} • Agency ID:{' '}
              <span className="font-mono">{me?.agency_employee_no || `EMP-${me?.id}`}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded">
              <MapPin className="w-3.5 h-3.5 text-[#0038A8] shrink-0" />
              <span>Station: <strong>{me?.school_details?.name || 'SDO Lucena City'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded font-mono">
              <Award className="w-3.5 h-3.5 text-[#0038A8] shrink-0" />
              <span>SG {me?.salary_grade?.grade || '11'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Metric Personal Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Leave Credits */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Leave Credits (VL / SL)
            </span>
            <CalendarCheck className="w-4 h-4 text-[#0038A8]" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {totalLeaveCredits.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">days available</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-600">
            <span>VL: {vlBalance.toFixed(1)}</span>
            <span>•</span>
            <span>SL: {slBalance.toFixed(1)}</span>
          </div>
        </div>

        {/* Attendance Compliance */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Recent Attendance
            </span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {attendance.length}
            </span>
            <span className="text-xs text-slate-500">recent logs recorded</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            CSC Form 48 Biometric station
          </span>
        </div>

        {/* Active Loan Status */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Provident Loans
            </span>
            <Wallet className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {activeLoans.length}
            </span>
            <span className="text-xs text-slate-500">active/pending</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2">
            Auto-payroll deduction
          </span>
        </div>

        {/* Latest Net Take-Home Pay */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Latest Net Take-Home
            </span>
            <Wallet className="w-4 h-4 text-[#0038A8]" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#0038A8]">
              {latestPayroll
                ? `₱${Number(latestPayroll.net_salary || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : '₱0.00'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-2 font-mono truncate">
            {latestPayroll?.cutoff_period || 'No payroll released yet'}
          </span>
        </div>
      </div>

      {/* Institutional Quick Action Shortcuts Strip */}
      <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-2">
          Workstation Actions:
        </span>

        <Link
          to="/attendance"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#0038A8] text-white rounded hover:bg-[#002c85] transition-colors shadow-xs"
        >
          <Clock className="w-3.5 h-3.5" />
          Time Clock Station
        </Link>

        <Link
          to="/my-leaves"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded hover:bg-slate-100 transition-colors"
        >
          <CalendarCheck className="w-3.5 h-3.5 text-[#0038A8]" />
          File CSC Form 6 Leave
        </Link>

        <Link
          to="/dtr"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded hover:bg-slate-100 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          View CSC Form 48 (DTR)
        </Link>

        <Link
          to="/my-payroll"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded hover:bg-slate-100 transition-colors"
        >
          <Wallet className="w-3.5 h-3.5 text-slate-600" />
          View Payslips
        </Link>

        <Link
          to="/my-ipcrf"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-800 rounded hover:bg-slate-100 transition-colors"
        >
          <Award className="w-3.5 h-3.5 text-slate-600" />
          RPMS / IPCRF Portfolio
        </Link>
      </div>

      {/* Two-Column Operational Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Recent Attendance & Time Logs */}
        <div className="lg:col-span-7 bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0038A8]" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Recent Attendance Logs (CSC Form 48)
              </h2>
            </div>
            <Link
              to="/dtr"
              className="text-xs text-[#0038A8] font-semibold hover:underline inline-flex items-center gap-1"
            >
              Full DTR <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-bold">Date</th>
                  <th className="py-2.5 px-3 font-bold text-center">Time In</th>
                  <th className="py-2.5 px-3 font-bold text-center">Time Out</th>
                  <th className="py-2.5 px-3 font-bold text-center">Status</th>
                  <th className="py-2.5 px-3 font-bold text-right">Station Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {attendance.length > 0 ? (
                  attendance.map((log) => {
                    const timeInFormatted = log.time_in
                      ? new Date(log.time_in).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';
                    const timeOutFormatted = log.time_out
                      ? new Date(log.time_out).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono tabular-nums text-slate-800 text-xs">
                          {log.date}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-900 font-semibold">
                          {timeInFormatted}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-900 font-semibold">
                          {timeOutFormatted}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.status === 'present'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : log.status === 'late'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {log.status || 'Present'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className={`inline-flex items-center text-[11px] font-medium ${
                              log.is_geo_flagged ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                            {log.is_geo_flagged ? 'Flagged Out of Bounds' : 'Verified Within Station'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-xs text-slate-400">
                      No attendance logs recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (5 cols): Statutory Leaves & Latest Compensation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Statutory Leave Balances */}
          <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#0038A8]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  CSC Form 6 Leave Balances
                </h3>
              </div>
              <Link
                to="/my-leaves"
                className="text-xs text-[#0038A8] font-semibold hover:underline"
              >
                Apply Leave
              </Link>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">Vacation Leave (VL)</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    {vlBalance.toFixed(1)} / 15.0 days
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#0038A8] h-2 rounded-full"
                    style={{ width: `${Math.min((vlBalance / 15) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-700">Sick Leave (SL)</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    {slBalance.toFixed(1)} / 15.0 days
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-2 rounded-full"
                    style={{ width: `${Math.min((slBalance / 15) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-1">
              Balances update in accordance with Civil Service Commission Leave Rules (Omnibus Rules on Leave).
            </p>
          </div>

          {/* Latest Compensation Docket */}
          <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#0038A8]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Latest Semi-Monthly Payslip
                </h3>
              </div>
              <Link
                to="/my-payroll"
                className="text-xs text-[#0038A8] font-semibold hover:underline"
              >
                All Payslips
              </Link>
            </div>

            {latestPayroll ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Cutoff Period:</span>
                  <strong className="font-mono text-slate-900">{latestPayroll.cutoff_period}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gross Compensation:</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    ₱{Number(latestPayroll.gross_salary || latestPayroll.basic_salary).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Deductions:</span>
                  <span className="font-mono tabular-nums text-red-700">
                    -₱{Number(latestPayroll.total_deductions || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-slate-900">
                  <span>Net Take-Home Pay:</span>
                  <span className="font-mono tabular-nums text-base text-[#0038A8]">
                    ₱{Number(latestPayroll.net_salary || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">
                No semi-monthly payslip generated for this period.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
