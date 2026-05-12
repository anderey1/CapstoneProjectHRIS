import React from 'react';
import { X, Calendar, Wallet, Percent, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const LoanDetailsModal = ({ loan, onClose }) => {
  if (!loan) return null;

  // Generate mock amortization schedule
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
      status: i < 2 ? 'Paid' : 'Upcoming' // Mocking first 2 months as paid if approved
    };
  });

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-[2.5rem] max-w-2xl p-0 overflow-hidden border border-base-300 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary to-primary p-8 text-white relative">
          <button onClick={onClose} className="absolute right-6 top-6 btn btn-ghost btn-circle btn-sm text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
                <Wallet className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-2xl font-black">Loan Details</h3>
                <p className="text-xs uppercase font-bold tracking-widest opacity-70">ID: LOAN-{loan.id.toString().padStart(4, '0')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-6">
             <div className="badge badge-lg bg-white/20 border-none text-white font-bold gap-2">
                <CheckCircle2 className="w-4 h-4" /> {loan.status.toUpperCase()}
             </div>
             <div className="badge badge-lg bg-white/20 border-none text-white font-bold gap-2">
                <Calendar className="w-4 h-4" /> {new Date(loan.date_applied).toLocaleDateString()}
             </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 text-center">
                <p className="text-[10px] font-black uppercase opacity-40 mb-1">Principal</p>
                <p className="text-lg font-black text-secondary">₱{parseFloat(loan.loan_amount).toLocaleString()}</p>
             </div>
             <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 text-center">
                <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Interest</p>
                <p className="text-lg font-black text-primary">₱{(parseFloat(loan.total_amount) - parseFloat(loan.loan_amount)).toLocaleString()}</p>
             </div>
             <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300 text-center">
                <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Payable</p>
                <p className="text-lg font-black text-neutral">₱{parseFloat(loan.total_amount).toLocaleString()}</p>
             </div>
          </div>

          {/* Schedule */}
          <div>
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-black text-lg flex items-center gap-2">
                   <Clock className="w-5 h-5 text-secondary" />
                   Amortization Schedule
                </h4>
                <span className="text-xs font-bold opacity-40">{term} Monthly Installments</span>
            </div>
            
            <div className="bg-base-100 rounded-3xl border border-base-300 overflow-hidden">
               <div className="max-h-60 overflow-y-auto">
                  <table className="table table-zebra w-full table-pin-rows">
                    <thead>
                      <tr className="bg-base-200 text-[10px] uppercase font-black opacity-50 tracking-widest border-none">
                        <th className="px-6 py-4">Month</th>
                        <th className="px-6 py-4">Due Date</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((item) => (
                        <tr key={item.month}>
                          <td className="px-6 py-4 font-bold">{item.month}</td>
                          <td className="px-6 py-4 opacity-70">{item.date}</td>
                          <td className="px-6 py-4 font-black text-primary">₱{item.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                             <span className={`badge badge-sm font-bold ${item.status === 'Paid' ? 'badge-success text-white' : 'badge-ghost opacity-50'}`}>
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

          <div className="alert alert-warning bg-warning/5 border-warning/20 rounded-2xl flex items-start gap-3">
             <AlertCircle className="w-5 h-5 mt-0.5" />
             <p className="text-xs font-medium leading-relaxed opacity-70">
                Monthly payments are automatically deducted from your payroll based on the division's semi-monthly cutoff schedule.
             </p>
          </div>
        </div>

        <div className="p-6 bg-base-200/50 flex justify-end">
           <button onClick={onClose} className="btn btn-ghost rounded-xl px-10 font-bold">Close Details</button>
        </div>
      </div>
      <div className="modal-backdrop bg-neutral/50" onClick={onClose}></div>
    </div>
  );
};

export default LoanDetailsModal;
