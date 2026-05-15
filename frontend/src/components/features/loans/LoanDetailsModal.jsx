import React from 'react';
import { X, Calendar, Wallet, Percent, Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

/**
 * Loan Details Modal (Schedule View)
 * 
 * Simple, professional redesign for viewing repayment schedules.
 */
const LoanDetailsModal = ({ loan, onClose }) => {
  if (!loan) return null;

  const monthlyPayment = parseFloat(loan.monthly_payment);
  const term = parseInt(loan.term_months);
  const startDate = new Date(loan.date_applied);
  
  const schedule = Array.from({ length: term }, (_, i) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i + 1);
    return {
      month: i + 1,
      date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      amount: monthlyPayment,
      status: i < 2 ? 'Paid' : 'Upcoming' 
    };
  });

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-xl max-w-2xl p-0 overflow-hidden border border-base-200 shadow-2xl bg-white animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-primary p-10 text-white relative">
          <button onClick={onClose} className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <FileText className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">Loan Details</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">ID: LOAN-{loan.id.toString().padStart(4, '0')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
             <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                {loan.status}
             </div>
             <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                {new Date(loan.date_applied).toLocaleDateString()}
             </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Financial Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-6 bg-base-50 rounded-xl border border-base-100 group hover:border-secondary/20 transition-all">
                <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Principal</p>
                <p className="text-xl font-black text-secondary tracking-tighter">₱{parseFloat(loan.loan_amount).toLocaleString()}</p>
             </div>
             <div className="p-6 bg-base-50 rounded-xl border border-base-100 group hover:border-primary/20 transition-all">
                <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Interest</p>
                <p className="text-xl font-black text-primary tracking-tighter">₱{(parseFloat(loan.total_amount) - parseFloat(loan.loan_amount)).toLocaleString()}</p>
             </div>
             <div className="p-6 bg-base-50 rounded-xl border border-base-100 group hover:border-base-content/20 transition-all">
                <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Total Cost</p>
                <p className="text-xl font-black text-base-content tracking-tighter">₱{parseFloat(loan.total_amount).toLocaleString()}</p>
             </div>
          </div>

          {/* Schedule Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h4 className="text-[11px] font-black uppercase tracking-widest opacity-40">Payment Schedule</h4>
                <span className="text-[10px] font-black opacity-20 uppercase tracking-widest">{term} Monthly Payments</span>
            </div>
            
            <div className="bg-white rounded-xl border border-base-200 shadow-sm overflow-hidden">
               <div className="max-h-60 overflow-y-auto">
                  <table className="table table-sm w-full">
                    <thead>
                      <tr className="bg-base-50/50 text-[10px] font-black uppercase tracking-widest opacity-40 border-b border-base-100">
                        <th className="py-4 px-8">#</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th className="text-right px-8">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-50">
                      {schedule.map((item) => (
                        <tr key={item.month} className="hover:bg-base-50/50 transition-colors">
                          <td className="py-4 px-8 font-black text-xs opacity-30">{item.month}</td>
                          <td className="text-xs font-bold text-base-content/60 uppercase">{item.date}</td>
                          <td className="font-black text-xs text-primary">₱{item.amount.toLocaleString()}</td>
                          <td className="text-right px-8">
                             <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                               item.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-base-50 text-base-content/30'
                             }`}>
                                {item.status}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-4">
             <AlertCircle className="w-4 h-4 mt-0.5 text-primary opacity-40" />
             <p className="text-[10px] font-bold text-primary/70 uppercase leading-relaxed tracking-tight">
                Payments are automatically deducted from your payroll based on the division's semi-monthly cutoff schedule.
             </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-base-50/50 border-t border-base-100 flex justify-end">
           <button onClick={onClose} className="btn btn-ghost text-[10px] font-black uppercase tracking-widest opacity-40">Close Details</button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default LoanDetailsModal;
