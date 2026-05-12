import React, { useState } from 'react';
import { PlusCircle, X, Info, Calculator, TrendingUp, Calendar } from 'lucide-react';

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

  // Live Calculation
  const amount = parseFloat(formData.loan_amount) || 0;
  const rate = parseFloat(formData.interest_rate) || 0;
  const term = parseInt(formData.term_months) || 1;

  const totalInterest = amount * (rate / 100);
  const totalRepayable = amount + totalInterest;
  const monthlyPayment = totalRepayable / term;

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-2xl p-0 overflow-hidden border border-base-300 max-w-lg shadow-xl bg-white">
        {/* Header: Solid & Professional */}
        <div className="bg-base-100 border-b border-base-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl flex items-center gap-2 text-base-content">
              <PlusCircle className="w-5 h-5 text-secondary" />
              Apply for Loan
            </h3>
            <p className="text-xs opacity-50 mt-1">Provident Personnel Welfare Program</p>
          </div>
          <button 
            className="btn btn-ghost btn-sm btn-circle" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-6">
          {['ADMIN', 'HR'].includes(user?.role) ? (
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Select Personnel</span></label>
              <select name="employee" className="select select-bordered w-full bg-base-100 rounded-lg" required>
                <option value="">Choose Personnel...</option>
                {employees?.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name} ({emp.position})</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 mt-0.5 text-blue-600" />
              <p className="text-xs font-medium text-blue-800 leading-relaxed">
                Applying for **{user?.username}**. Please ensure your salary can cover the monthly deductions.
              </p>
            </div>
          )}

          <div className="form-control">
            <label className="label"><span className="label-text font-semibold">Requested Amount (₱)</span></label>
            <input
              name="loan_amount"
              type="number"
              step="0.01"
              value={formData.loan_amount}
              onChange={handleInputChange}
              placeholder="0.00"
              className="input input-bordered w-full bg-base-100 rounded-lg text-lg font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Interest Rate (%)</span></label>
              <input
                name="interest_rate"
                type="number"
                step="0.1"
                value={formData.interest_rate}
                onChange={handleInputChange}
                className="input input-bordered w-full bg-base-100 rounded-lg"
                required
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-semibold">Term</span></label>
              <select
                name="term_months"
                value={formData.term_months}
                onChange={handleInputChange}
                className="select select-bordered w-full bg-base-100 rounded-lg"
                required
              >
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
                <option value="18">18 Months</option>
                <option value="24">24 Months</option>
              </select>
            </div>
          </div>

          {/* Real-time Preview: Solid Style */}
          {amount > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-4">
                <Calculator className="w-4 h-4" /> Amortization Preview
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Monthly Payment</p>
                  <p className="text-xl font-bold text-gray-900">₱{monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Total Repayable</p>
                  <p className="text-lg font-bold text-gray-700">₱{totalRepayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          )}

          <div className="modal-action mt-8 pt-4 border-t border-base-200 bg-base-50 p-6 -mx-8 -mb-8">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-secondary px-10 ${isPending ? 'loading' : ''}`}
              disabled={isPending}
            >
              {isPending ? 'Submitting...' : 'Apply for Loan'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/60" onClick={onClose}></div>
    </div>
  );
};

export default ApplyLoanModal;

