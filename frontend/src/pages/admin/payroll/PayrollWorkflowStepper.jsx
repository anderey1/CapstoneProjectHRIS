import React from 'react';
import { Calendar } from 'lucide-react';

const PayrollWorkflowStepper = ({ selectedCutoff, cutoffStatus, totalGross, totalDeductions, totalNet }) => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-base-200 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-base-100 pb-5">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-base-content flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            Steps for selected period: {selectedCutoff}
          </h3>
          <p className="text-[10px] font-bold uppercase opacity-45">Follow these steps to calculate, approve, and send salaries to bank accounts</p>
        </div>
        
        {/* Stats Badges */}
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-base-100 rounded-lg text-center border border-base-200">
            <span className="block text-[8px] font-black uppercase tracking-wider opacity-40">Gross Pay (Before Deductions)</span>
            <span className="text-xs font-black text-base-content">₱{totalGross.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="px-3 py-1 bg-base-100 rounded-lg text-center border border-base-200">
            <span className="block text-[8px] font-black uppercase tracking-wider opacity-40">Total Deductions</span>
            <span className="text-xs font-black text-rose-600">₱{totalDeductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
          <div className="px-3 py-1 bg-blue-50 rounded-lg text-center border border-blue-100">
            <span className="block text-[8px] font-black uppercase tracking-wider opacity-40 text-blue-600">Net Pay (Take-Home)</span>
            <span className="text-xs font-black text-blue-700">₱{totalNet.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>
      
      {/* Stepper Visuals */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Step 1: Accountant Preparation */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${
          cutoffStatus !== 'unprepared' 
            ? 'bg-blue-50 border-blue-200 text-blue-900' 
            : 'bg-base-50 border-base-200 opacity-60'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              cutoffStatus !== 'unprepared' ? 'bg-blue-600 text-white' : 'bg-base-300 text-base-content/60'
            }`}>1</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide">1. Accountant Preparation</p>
              <p className="text-[9px] opacity-60 font-bold uppercase">{cutoffStatus === 'unprepared' ? 'Not Started' : 'Draft Prepared'}</p>
            </div>
          </div>
        </div>

        {/* Step 2: Superintendent Approval */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${
          cutoffStatus === 'approved' || cutoffStatus === 'released'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : cutoffStatus === 'draft'
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-base-50 border-base-200 opacity-60'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              cutoffStatus === 'approved' || cutoffStatus === 'released'
                ? 'bg-emerald-600 text-white'
                : cutoffStatus === 'draft'
                ? 'bg-amber-500 text-white'
                : 'bg-base-300 text-base-content/60'
            }`}>2</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide">2. Superintendent Review</p>
              <p className="text-[9px] opacity-60 font-bold uppercase">
                {cutoffStatus === 'released' || cutoffStatus === 'approved' ? 'Approved & Signed' : cutoffStatus === 'draft' ? 'Awaiting Signature' : 'Awaiting Step 1'}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Disbursement Voucher */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${
          cutoffStatus === 'released'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : cutoffStatus === 'approved'
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-base-50 border-base-200 opacity-60'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              cutoffStatus === 'released'
                ? 'bg-emerald-600 text-white'
                : cutoffStatus === 'approved'
                ? 'bg-amber-500 text-white'
                : 'bg-base-300 text-base-content/60'
            }`}>3</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide">3. Official Voucher (DV)</p>
              <p className="text-[9px] opacity-60 font-bold uppercase">
                {cutoffStatus === 'released' ? 'Voucher Prepared' : cutoffStatus === 'approved' ? 'Ready to Release' : 'Awaiting Step 2'}
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Released / Credited */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${
          cutoffStatus === 'released'
            ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
            : 'bg-base-50 border-base-200 opacity-60'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              cutoffStatus === 'released' ? 'bg-emerald-600 text-white' : 'bg-base-300 text-base-content/60'
            }`}>4</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wide">4. Sent to Bank (ATM)</p>
              <p className="text-[9px] opacity-60 font-bold uppercase">
                {cutoffStatus === 'released' ? 'Paid to Employees' : 'Awaiting Release'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollWorkflowStepper;
