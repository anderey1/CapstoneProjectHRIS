import React, { useState } from 'react';
import { PlusCircle, X, Info, Calculator, TrendingUp, Calendar, Wallet } from 'lucide-react';

/**
 * Apply Loan Modal
 * 
 * Simple, professional redesign for loan applications.
 */
const ApplyLoanModal = ({ isOpen, onClose, onSubmit, isPending, user, employees }) => {
  const [formData, setFormData] = useState({
    loan_amount: '',
    interest_rate: '5.0',
    term_months: '12'
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const amount = parseFloat(formData.loan_amount) || 0;
  const rate = parseFloat(formData.interest_rate) || 0;
  const term = parseInt(formData.term_months) || 1;

  const totalInterest = amount * (rate / 100);
  const totalRepayable = amount + totalInterest;
  const monthlyPayment = totalRepayable / term;

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-xl p-0 overflow-hidden border border-base-200 max-w-lg shadow-2xl bg-white animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-base-50/50 border-b border-base-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center text-secondary">
                <Wallet className="w-4 h-4" />
             </div>
             <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-base-content">Apply for Loan</h2>
                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] mt-0.5">Personnel Welfare Program</p>
             </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle opacity-30 hover:opacity-100">
             <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-6">
          {['ADMIN', 'HR'].includes(user?.role) ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Select Staff</label>
              <select name="employee" className="select select-sm w-full bg-base-50 border-base-100 focus:border-secondary rounded-lg text-[10px] font-black uppercase tracking-widest" required>
                <option value="">Choose Staff Member...</option>
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.position})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg flex items-start gap-3">
              <Info className="w-4 h-4 mt-0.5 text-primary opacity-60" />
              <p className="text-[10px] font-bold text-primary/80 uppercase leading-relaxed tracking-tight">
                Applying for **{user?.username}**. Please ensure your salary can cover the monthly deductions.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Amount (₱)</label>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black opacity-30">₱</span>
               <input
                 name="loan_amount"
                 type="number"
                 step="0.01"
                 value={formData.loan_amount}
                 onChange={handleInputChange}
                 placeholder="0.00"
                 className="input input-lg w-full pl-10 bg-base-50 border-base-100 focus:border-secondary rounded-xl text-2xl font-black tracking-tight"
                 required
               />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Rate (%)</label>
              <input
                name="interest_rate"
                type="number"
                step="0.1"
                value={formData.interest_rate}
                onChange={handleInputChange}
                className="input input-sm w-full bg-base-50 border-base-100 focus:border-secondary rounded-lg text-xs font-bold"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Term</label>
              <select
                name="term_months"
                value={formData.term_months}
                onChange={handleInputChange}
                className="select select-sm w-full bg-base-50 border-base-100 focus:border-secondary rounded-lg text-[10px] font-black uppercase tracking-widest"
                required
              >
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
                <option value="18">18 Months</option>
                <option value="24">24 Months</option>
              </select>
            </div>
          </div>

          {/* Amortization Preview */}
          {amount > 0 && (
            <div className="bg-white border-2 border-dashed border-base-100 rounded-xl p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-30">
                <Calculator className="w-3 h-3" /> Amortization
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Monthly Pay</p>
                  <p className="text-xl font-black text-base-content tracking-tight">₱{monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[9px] font-black text-secondary uppercase tracking-widest opacity-60">Total Cost</p>
                  <p className="text-lg font-black text-base-content tracking-tight">₱{totalRepayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-base-100">
            <button type="button" className="btn btn-ghost flex-1 text-[10px] font-black uppercase tracking-widest opacity-40" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-secondary flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-secondary/20" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Apply Now'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default ApplyLoanModal;
