import React, { useState } from 'react';
import { Calendar, Info, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import LoanDetailsModal from './LoanDetailsModal';

/**
 * Loan Card (Loan Item)
 * 
 * Simple, professional redesign with high-density financial data.
 */
const LoanCard = ({ loan, user, onApprove, onReject, isProcessing }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <div className="px-2 py-0.5 bg-success/10 text-success rounded-full text-[9px] font-black uppercase tracking-widest">Approved</div>;
      case 'rejected': return <div className="px-2 py-0.5 bg-error/10 text-error rounded-full text-[9px] font-black uppercase tracking-widest">Rejected</div>;
      case 'paid': return <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">Paid</div>;
      default: return <div className="px-2 py-0.5 bg-warning/10 text-warning rounded-full text-[9px] font-black uppercase tracking-widest">Pending</div>;
    }
  };

  return (
    <div className="bg-white border border-base-200 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group">
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/5 border border-secondary/5 rounded-lg flex items-center justify-center text-secondary font-black uppercase text-xs">
              {loan.employee_name[0]}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-black text-sm text-base-content uppercase tracking-tight leading-tight">{loan.employee_name}</h3>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">LOAN-{loan.id.toString().padStart(4, '0')}</p>
            </div>
          </div>
          {getStatusBadge(loan.status)}
        </div>

        <div className="grid grid-cols-2 gap-4 bg-base-50 p-4 rounded-lg border border-base-100 mb-6">
          <div>
            <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Principal</p>
            <p className="text-lg font-black text-secondary tracking-tight">₱{parseFloat(loan.loan_amount).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-1">Monthly</p>
            <p className="text-lg font-black text-primary tracking-tight">₱{parseFloat(loan.monthly_payment).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-black opacity-40 uppercase tracking-widest px-1">
          <span className="flex items-center gap-1.5">Rate: {loan.interest_rate}%</span>
          <span className="flex items-center gap-1.5">Term: {loan.term_months} Mo</span>
        </div>

        {/* Admin/HR Actions */}
        {['ADMIN', 'HR'].includes(user?.role) && loan.status === 'pending' && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-base-50">
            <button 
              className="btn btn-ghost btn-sm flex-1 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100"
              onClick={() => { if(window.confirm('Reject this application?')) onReject(loan.id) }}
              disabled={isProcessing}
            >
              Reject
            </button>
            <button 
              className="btn btn-secondary btn-sm flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-secondary/10"
              onClick={() => onApprove(loan.id)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Approve'}
            </button>
          </div>
        )}
        
        {loan.status === 'approved' && (
          <div className="mt-6 pt-4 border-t border-base-50 flex items-center justify-between">
            <div className="text-[9px] font-black text-success uppercase tracking-widest opacity-60">
              Active Amortization
            </div>
            <button 
              onClick={() => setShowDetails(true)}
              className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {showDetails && (
        <LoanDetailsModal 
          loan={loan} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </div>
  );
};

export default LoanCard;
