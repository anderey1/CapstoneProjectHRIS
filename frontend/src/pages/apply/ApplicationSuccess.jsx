import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ApplicationSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] relative overflow-hidden p-6">
      <div className="absolute top-0 left-0 w-full h-2 bg-[#0038A8]"></div>
      
      <div className="card w-full max-w-lg bg-white shadow-lg border border-slate-200 rounded-xl overflow-hidden z-10 text-center p-8 sm:p-12">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-[#0038A8] uppercase tracking-tight mb-2">Application Submitted!</h1>
        <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-6">DepEd Lucena City Division</p>
        
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-700 mb-8 leading-relaxed max-w-sm mx-auto">
          Thank you for submitting your application. We have dispatched a confirmation receipt containing your evaluation summary to your registered email address.
        </div>

        <a 
          href="/login" 
          className="btn bg-[#0038A8] hover:bg-[#002d86] text-white border-none shadow-sm rounded-lg text-xs font-black uppercase tracking-widest px-8 h-12"
        >
          Return to Login
        </a>
      </div>
    </div>
  );
};

export default ApplicationSuccess;
