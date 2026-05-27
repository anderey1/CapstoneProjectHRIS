import React, { useState, useEffect } from 'react';
import { X, Info, Calculator, Wallet, Upload, FileCheck, Trash2 } from 'lucide-react';

const PURPOSE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'medical', label: 'Medical' },
  { value: 'calamity', label: 'Calamity' },
  { value: 'educational', label: 'Educational' },
  { value: 'emergency', label: 'Emergency' },
];

const DOC_TYPES = [
  { value: 'laf', label: 'Loan Application Form (LAF)' },
  { value: 'letter_request', label: 'Letter Request' },
  { value: 'auth_deduct', label: 'Authorization to Deduct' },
  { value: 'payslip', label: 'Payslip' },
  { value: 'deped_id', label: 'DepEd ID' },
  { value: 'comaker_payslip', label: 'Co-Maker Payslip' },
  { value: 'medical_abstract', label: 'Medical Abstract/Certificate' },
  { value: 'calamity_cert', label: 'Calamity Certificate' },
  { value: 'appointment', label: 'Approved Appointment' },
  { value: 'service_record', label: 'Updated Service Record' },
  { value: 'contract', label: 'Contract of Service' },
];

/**
 * Apply Loan Modal — Extended with purpose, letter, co-maker, and doc uploads.
 */
const ApplyLoanModal = ({ isOpen, onClose, onSubmit, isPending, user, employees, initialData }) => {
  const [formData, setFormData] = useState({
    loan_amount: '',
    interest_rate: '5.0',
    term_months: '12',
    purpose: 'general',
    letter_request: '',
    co_maker_name: '',
  });
  const [files, setFiles] = useState([]); // { doc_type, file }

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          loan_amount: initialData.loan_amount,
          interest_rate: initialData.interest_rate,
          term_months: initialData.term_months,
          purpose: initialData.purpose,
          letter_request: initialData.letter_request,
          co_maker_name: initialData.co_maker_name || '',
          employee: initialData.employee
        });
      } else {
        setFormData({
          loan_amount: '',
          interest_rate: '5.0',
          term_months: '12',
          purpose: 'general',
          letter_request: '',
          co_maker_name: '',
        });
      }
      setFiles([]);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddFile = (docType) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert('File must be under 5MB.');
        return;
      }
      setFiles(prev => [...prev.filter(f => f.doc_type !== docType), { doc_type: docType, file }]);
    };
    input.click();
  };

  const handleRemoveFile = (docType) => {
    setFiles(prev => prev.filter(f => f.doc_type !== docType));
  };

  const amount = parseFloat(formData.loan_amount) || 0;
  const rate = parseFloat(formData.interest_rate) || 0;
  const term = parseInt(formData.term_months) || 1;
  const totalInterest = amount * (rate / 100);
  const totalRepayable = amount + totalInterest;
  const monthlyPayment = totalRepayable / term;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, files);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-xl p-0 overflow-hidden border border-base-200 max-w-2xl w-[95vw] shadow-2xl bg-white animate-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="border-b border-base-100 p-6 flex items-center justify-between bg-white shrink-0">
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

        <form onSubmit={handleFormSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Staff selector (Admin/HR) or info banner */}
          {['ADMIN', 'HR'].includes(user?.role) ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Select Staff</label>
              <select name="employee" className="select select-sm w-full bg-base-50 border-base-100 focus:border-secondary rounded-lg text-[10px] font-black uppercase tracking-widest" required onChange={handleInputChange}>
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
                Applying as <strong>{user?.username}</strong>. Ensure your salary can cover monthly deductions.
              </p>
            </div>
          )}

          {/* Purpose */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Loan Purpose</label>
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              className="select select-sm w-full bg-base-50 border-base-100 focus:border-secondary rounded-lg text-[10px] font-black uppercase tracking-widest"
              required
            >
              {PURPOSE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
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

          {/* Rate + Term */}
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

          {/* Co-Maker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Co-Maker Name</label>
            <input
              name="co_maker_name"
              type="text"
              value={formData.co_maker_name}
              onChange={handleInputChange}
              placeholder="Full name of co-maker"
              className="input input-sm w-full bg-base-50 border-base-100 focus:border-secondary rounded-lg text-xs font-bold"
            />
          </div>

          {/* Letter Request */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Letter Request</label>
            <textarea
              name="letter_request"
              value={formData.letter_request}
              onChange={handleInputChange}
              placeholder="State the purpose of your loan..."
              rows={3}
              className="textarea textarea-sm w-full bg-base-50 border-base-100 focus:border-secondary rounded-lg text-xs font-bold leading-relaxed"
            />
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

          {/* Document Uploads */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Attach Documents (optional for now)</label>
            <div className="space-y-2">
              {DOC_TYPES.slice(0, 6).map(doc => {
                const attached = files.find(f => f.doc_type === doc.value);
                return (
                  <div key={doc.value} className="flex items-center justify-between p-3 bg-base-50 border border-base-100 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileCheck className={`w-3.5 h-3.5 ${attached ? 'text-success' : 'opacity-20'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wide">{doc.label}</span>
                    </div>
                    {attached ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-success uppercase">{attached.file.name.slice(0, 20)}</span>
                        <button type="button" onClick={() => handleRemoveFile(doc.value)} className="btn btn-ghost btn-xs btn-circle opacity-40 hover:opacity-100">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => handleAddFile(doc.value)} className="btn btn-ghost btn-xs text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">
                        <Upload className="w-3 h-3 mr-1" /> Upload
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-6 border-t border-base-100">
            <button type="button" className="btn btn-ghost flex-1 text-[10px] font-black uppercase tracking-widest opacity-40" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-secondary flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-secondary/20" disabled={isPending}>
              {isPending ? 'Submitting...' : (initialData ? 'Resubmit Application' : 'Apply Now')}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default ApplyLoanModal;
