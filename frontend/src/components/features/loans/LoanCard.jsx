import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronRight, MessageSquare, Users, Tag } from 'lucide-react';
import LoanDetailsModal from './LoanDetailsModal';

const PURPOSE_LABELS = {
  general: 'General',
  medical: 'Medical',
  calamity: 'Calamity',
  educational: 'Educational',
  emergency: 'Emergency',
};

/**
 * Loan Card — Shows purpose badge, co-maker, and review info.
 */
const LoanCard = ({ loan, user, onApprove, onReject, onResubmit, isProcessing }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified': return <div className="px-2 py-0.5 bg-info/10 text-info rounded-full text-[9px] font-black uppercase tracking-widest">Verified</div>;
      case 'approved': return <div className="px-2 py-0.5 bg-success/10 text-success rounded-full text-[9px] font-black uppercase tracking-widest">Approved</div>;
      case 'released': return <div className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest">Released</div>;
      case 'rejected': return <div className="px-2 py-0.5 bg-error/10 text-error rounded-full text-[9px] font-black uppercase tracking-widest">Rejected</div>;
      case 'paid': return <div className="px-2 py-0.5 bg-success/10 text-success rounded-full text-[9px] font-black uppercase tracking-widest">Paid</div>;
      default: return <div className="px-2 py-0.5 bg-warning/10 text-warning rounded-full text-[9px] font-black uppercase tracking-widest">Pending</div>;
    }
  };

  const handleReject = () => {
    if (!rejectRemarks.trim()) return;
    onReject(loan.id, rejectRemarks);
    setShowRejectInput(false);
    setRejectRemarks('');
  };

  return (
    <div className="bg-white border border-base-200 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/5 border border-secondary/5 rounded-lg flex items-center justify-center text-secondary font-black uppercase text-xs">
              {loan.employee_name?.[0] || '?'}
            </div>
            <div className="space-y-0.5">
              <h3 className="font-black text-sm text-base-content uppercase tracking-tight leading-tight">{loan.employee_name}</h3>
              <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">LOAN-{loan.id.toString().padStart(4, '0')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loan.purpose && (
              <div className="px-2 py-0.5 bg-info/10 text-info rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                {PURPOSE_LABELS[loan.purpose] || loan.purpose}
              </div>
            )}
            {getStatusBadge(loan.status)}
          </div>
        </div>

        {/* Co-maker info */}
        {(loan.co_maker_name_display || loan.co_maker_name) && (
          <div className="flex items-center gap-2 mb-4 px-1">
            <Users className="w-3 h-3 opacity-30" />
            <span className="text-[10px] font-bold opacity-40 uppercase tracking-wide">Co-maker: {loan.co_maker_name_display || loan.co_maker_name}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 bg-base-50 p-4 rounded-lg border border-base-100 mb-4">
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

        {/* Remarks (if reviewed) */}
        {loan.remarks && (
          <div className="mt-4 p-3 bg-base-50 rounded-lg border border-base-100 flex items-start gap-2">
            <MessageSquare className="w-3 h-3 mt-0.5 opacity-30 shrink-0" />
            <div>
              <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-0.5">Superisor Remarks</p>
              <p className="text-[10px] font-bold text-base-content/70">{loan.remarks}</p>
            </div>
          </div>
        )}

        {/* Admin/HR Actions */}
        {['HR'].includes(user?.role) && loan.status === 'pending' && (
          <div className="mt-6 pt-6 border-t border-base-50 space-y-3">
            {showRejectInput ? (
              <div className="space-y-2">
                <textarea
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Reason for rejection (required)..."
                  rows={2}
                  className="textarea textarea-sm w-full bg-base-50 border-base-100 rounded-lg text-xs font-bold"
                />
                <div className="flex gap-2">
                  <button
                    className="btn btn-ghost btn-sm flex-1 text-[10px] font-black uppercase tracking-widest opacity-40"
                    onClick={() => { setShowRejectInput(false); setRejectRemarks(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-error btn-sm flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                    onClick={handleReject}
                    disabled={!rejectRemarks.trim() || isProcessing}
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button 
                  className="btn btn-ghost btn-sm flex-1 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100"
                  onClick={() => setShowRejectInput(true)}
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
          </div>
        )}
        
        {/* Details link for approved/released loans */}
        {(loan.status === 'approved' || loan.status === 'released') && (
          <div className="mt-6 pt-4 border-t border-base-50 flex items-center justify-between">
            <div className="text-[9px] font-black text-success uppercase tracking-widest opacity-60">
              {loan.status === 'released' ? 'Active Ledger' : 'Active Amortization'}
            </div>
            <button 
              onClick={() => setShowDetails(true)}
              className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* View details for any status */}
        {loan.status !== 'approved' && loan.status !== 'released' && (
          <div className="mt-4 pt-4 border-t border-base-50 flex justify-between items-center">
             {loan.status === 'rejected' && onResubmit && (
               <button 
                 onClick={() => onResubmit(loan)}
                 className="btn btn-warning btn-xs rounded-lg font-black text-[9px] uppercase tracking-widest px-4 shadow-sm"
               >
                 Edit & Resubmit
               </button>
             )}
             <div className="flex-1"></div>
             <button 
               onClick={() => setShowDetails(true)}
               className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline flex items-center gap-1"
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
