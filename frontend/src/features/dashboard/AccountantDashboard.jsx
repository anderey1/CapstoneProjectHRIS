import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { Wallet, FileText, AlertCircle, TrendingUp, HandCoins, BarChart3, PieChart as PieChartIcon, ShieldCheck, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = ['#0038A8', '#0A225C', '#15803D', '#B45309', '#0284C7'];

const AccountantDashboard = ({ stats }) => {
  const { data: payrollData, isLoading: payrollLoading, isError: payrollError } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.PAYROLL],
    queryFn: () => api.get('analytics/payroll/').then(res => res.data)
  });

  const { data: loanData, isLoading: loanLoading, isError: loanError } = useQuery({
    queryKey: [QUERY_KEYS.CHARTS.LOAN_STATUS],
    queryFn: () => api.get('analytics/loans/').then(res => res.data)
  });

  const formattedPayroll = payrollData?.map(item => ({
    name: item.cutoff_period,
    amount: parseFloat(item.total_net)
  })).reverse() || [];

  const formattedLoans = loanData?.map(item => ({
    name: item.status?.toUpperCase() || 'UNKNOWN',
    value: item.count
  })) || [];

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Disbursed */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Disbursed</span>
            <span className="p-2 bg-slate-100 rounded-md text-[#0038A8]">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              ₱{stats?.total_payroll_disbursed || '0.00'}
            </span>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Net Payroll
            </span>
          </div>
        </div>

        {/* Card 2: Loan Portfolio */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Loan Portfolio</span>
            <span className="p-2 bg-slate-100 rounded-md text-[#0038A8]">
              <HandCoins className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              ₱{stats?.total_loan_portfolio || '0.00'}
            </span>
            <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
              Released Capital
            </span>
          </div>
        </div>

        {/* Card 3: Approved Loans */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Approved Loans</span>
            <span className="p-2 bg-amber-50 rounded-md text-amber-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats?.approved_loan_count ?? 0}
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
              Ready for Funds
            </span>
          </div>
        </div>

        {/* Card 4: Payroll Batches */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payroll Ready</span>
            <span className="p-2 bg-green-50 rounded-md text-green-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {stats?.ready_for_release ?? 0}
            </span>
            <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded flex items-center gap-1">
              Approved Cycles
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payroll Disbursements Area Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#0038A8]" />
              <h3 className="text-sm font-semibold text-slate-900">Disbursement Trends (Last 6 Cutoffs)</h3>
            </div>
            <span className="text-xs text-slate-500">Semi-Monthly</span>
          </div>

          <div className="h-[280px] w-full">
            {payrollLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#0038A8]" />
                <span className="text-xs">Loading disbursement records...</span>
              </div>
            ) : payrollError ? (
              <div className="h-full flex items-center justify-center text-red-600 text-xs gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Unable to load disbursement trends</span>
              </div>
            ) : formattedPayroll.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedPayroll} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0038A8" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0038A8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} tickFormatter={(val) => `₱${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
                    cursor={{ stroke: '#cbd5e1' }}
                    contentStyle={{ borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(val) => [`₱${val.toLocaleString()}`, 'Net Disbursed']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#0038A8" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorAmt)" 
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#0038A8' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No finalized payroll history available for visualization.
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Accounting Note:</span> Values reflect audited net disbursements after GSIS, PhilHealth, Pag-IBIG, and loan deductions.
          </div>
        </div>

        {/* Loan Portfolio Status Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#0038A8]" />
              <h3 className="text-sm font-semibold text-slate-900">Loan Portfolio Mix</h3>
            </div>
            <span className="text-xs text-slate-500">Applications</span>
          </div>

          <div className="h-[240px] w-full relative">
            {loanLoading ? (
              <div className="h-full flex items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#0038A8]" />
                <span className="text-xs">Loading loan metrics...</span>
              </div>
            ) : loanError ? (
              <div className="h-full flex items-center justify-center text-red-600 text-xs gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Unable to load loan data</span>
              </div>
            ) : formattedLoans.length > 0 ? (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">
                    {formattedLoans.reduce((acc, curr) => acc + curr.value, 0)}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedLoans}
                      innerRadius={65}
                      outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {formattedLoans.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                No provident loan applications recorded.
              </div>
            )}
          </div>

          {/* Loan Status Legend */}
          <div className="mt-4 space-y-2 pt-3 border-t border-slate-100">
            {formattedLoans.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                  <span className="text-xs font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountantDashboard;
