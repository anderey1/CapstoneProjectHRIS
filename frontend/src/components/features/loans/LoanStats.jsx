import React from 'react';
import { Clock, CheckCircle2, Wallet, TrendingUp } from 'lucide-react';

/**
 * Loan Stats Cards
 * 
 * Simple, professional redesign for loan overview.
 */
const LoanStats = ({ loans }) => {
  const pendingCount = loans?.filter(l => l.status === 'pending').length || 0;
  const approvedCount = loans?.filter(l => l.status === 'approved').length || 0;
  const totalActive = loans?.reduce((acc, l) => l.status === 'approved' ? acc + parseFloat(l.loan_amount) : acc, 0) || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl border border-base-200 shadow-sm flex items-center gap-4 group hover:border-warning/20 transition-all">
        <div className="w-12 h-12 bg-warning/5 text-warning border border-warning/5 rounded-lg flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase opacity-30 tracking-[0.2em] mb-1">Pending</p>
          <p className="text-2xl font-black text-base-content tracking-tighter">{pendingCount}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-base-200 shadow-sm flex items-center gap-4 group hover:border-success/20 transition-all">
        <div className="w-12 h-12 bg-success/5 text-success border border-success/5 rounded-lg flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase opacity-30 tracking-[0.2em] mb-1">Approved</p>
          <p className="text-2xl font-black text-base-content tracking-tighter">{approvedCount}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-base-200 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all">
        <div className="w-12 h-12 bg-primary/5 text-primary border border-primary/5 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase opacity-30 tracking-[0.2em] mb-1">Total Released</p>
          <p className="text-2xl font-black text-base-content tracking-tighter">₱{totalActive.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default LoanStats;
