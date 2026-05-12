import React, { useState } from 'react';
import { Calendar, Info, Clock, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import LoanDetailsModal from './LoanDetailsModal';

const LoanCard = ({ loan, user, onApprove, onReject, isProcessing }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <div className="badge badge-success gap-1 text-[10px] font-bold py-2 text-white"><CheckCircle2 className="w-3 h-3" /> Approved</div>;
      case 'rejected': return <div className="badge badge-error gap-1 text-[10px] font-bold py-2 text-white"><XCircle className="w-3 h-3" /> Rejected</div>;
      case 'paid': return <div className="badge badge-info gap-1 text-[10px] font-bold py-2 text-white"><CheckCircle2 className="w-3 h-3" /> Paid</div>;
      default: return <div className="badge badge-warning gap-1 text-[10px] font-bold py-2"><Clock className="w-3 h-3" /> Pending</div>;
    }
  };

  return (
    <div className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-xl hover:border-secondary/30 transition-all duration-300 rounded-3xl overflow-hidden group">
      <div className="card-body p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="avatar placeholder">
              <div className="bg-secondary/10 text-secondary rounded-2xl w-12 font-black uppercase text-lg flex items-center justify-center">
                {loan.employee_name[0]}
              </div>
            </div>
            <div>
              <h3 className="font-black text-lg group-hover:text-secondary transition-colors">{loan.employee_name}</h3>
              <div className="flex items-center gap-2 mt-1 text-[10px] opacity-40 font-black uppercase tracking-widest">
                <Calendar className="w-3 h-3" />
                ID: LOAN-{loan.id.toString().padStart(4, '0')}
              </div>
            </div>
          </div>
          {getStatusBadge(loan.status)}
        </div>

        <div className="grid grid-cols-2 gap-4 bg-base-200/50 p-5 rounded-2xl mb-6">
          <div>
            <p className="text-[10px] uppercase font-black opacity-30 tracking-tighter mb-1">Principal Amount</p>
            <p className="text-xl font-black text-secondary">₱{parseFloat(loan.loan_amount).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-black opacity-30 tracking-tighter mb-1">Monthly Pay</p>
            <p className="text-xl font-black text-primary">₱{parseFloat(loan.monthly_payment).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold opacity-50 px-2 uppercase tracking-tight">
          <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Rate: {loan.interest_rate}%</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Term: {loan.term_months} Months</span>
        </div>

        {/* Admin/HR Actions */}
        {['ADMIN', 'HR'].includes(user?.role) && loan.status === 'pending' && (
          <div className="card-actions justify-end mt-6 pt-6 border-t border-base-300 gap-3">
            <button 
              className="btn btn-ghost btn-sm text-error rounded-xl font-bold"
              onClick={() => { if(window.confirm('Reject this application?')) onReject(loan.id) }}
              disabled={isProcessing}
            >
              Reject
            </button>
            <button 
              className="btn btn-secondary btn-sm rounded-xl px-6 shadow-md shadow-secondary/20"
              onClick={() => onApprove(loan.id)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Approve Application'}
            </button>
          </div>
        )}
        
        {loan.status === 'approved' && (
          <div className="mt-6 pt-6 border-t border-base-300 flex items-center justify-between animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2 text-[10px] font-black text-success uppercase tracking-widest">
              <CheckCircle2 className="w-4 h-4" />
              Active Amortization
            </div>
            <button 
              onClick={() => setShowDetails(true)}
              className="btn btn-xs btn-ghost text-secondary rounded-lg"
            >
              View Details <ChevronRight className="w-3 h-3" />
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
