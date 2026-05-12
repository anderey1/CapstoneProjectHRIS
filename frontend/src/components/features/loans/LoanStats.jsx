import React from 'react';
import { Clock, CheckCircle2, Wallet } from 'lucide-react';

const LoanStats = ({ loans }) => {
  const pendingCount = loans?.filter(l => l.status === 'pending').length || 0;
  const approvedCount = loans?.filter(l => l.status === 'approved').length || 0;
  const totalActive = loans?.reduce((acc, l) => l.status === 'approved' ? acc + parseFloat(l.loan_amount) : acc, 0) || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-base-100 p-4 rounded-3xl border border-base-300 flex items-center gap-4">
        <div className="p-3 bg-warning/10 text-warning rounded-2xl"><Clock className="w-5 h-5" /></div>
        <div>
          <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">Pending</p>
          <p className="text-2xl font-black">{pendingCount}</p>
        </div>
      </div>
      <div className="bg-base-100 p-4 rounded-3xl border border-base-300 flex items-center gap-4">
        <div className="p-3 bg-success/10 text-success rounded-2xl"><CheckCircle2 className="w-5 h-5" /></div>
        <div>
          <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">Approved</p>
          <p className="text-2xl font-black">{approvedCount}</p>
        </div>
      </div>
      <div className="bg-base-100 p-4 rounded-3xl border border-base-300 flex items-center gap-4">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl"><Wallet className="w-5 h-5" /></div>
        <div>
          <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">Active Funds</p>
          <p className="text-2xl font-black">₱{totalActive.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default LoanStats;
