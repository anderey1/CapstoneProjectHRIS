import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { AccountantDashboard } from '../../features/dashboard';
import { Wallet, ShieldCheck } from 'lucide-react';

/**
 * AccountantDashboardPage
 * Dedicated single-responsibility dashboard for DepEd Accountant.
 * Fetches only financial metrics, loan statuses, and payroll summaries.
 */
const AccountantDashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD],
    queryFn: () => api.get('analytics/dashboard/').then(res => res.data)
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center h-[60vh] items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-base-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-[#0038A8] border border-blue-100 rounded-xl flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">
                Financial Operations Dashboard
              </h1>
              <p className="text-xs font-semibold text-slate-500 tracking-wide">
                DepEd Schools Division of Lucena City • Payroll Disbursement & Loan Portfolios
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-outline font-semibold py-2.5 px-3 text-xs text-slate-700 bg-slate-50 border-slate-200 gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Accounting Station Active
          </span>
        </div>
      </div>

      {/* Main Dedicated Content */}
      <AccountantDashboard stats={stats} />
    </div>
  );
};

export default AccountantDashboardPage;
