import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ApplicationSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] relative overflow-hidden p-6">
      <div className="absolute top-0 left-0 w-full h-2 bg-[#0038A8]"></div>
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#0038A8]/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#FCD116]/5 rounded-full blur-3xl"></div>
      
      <div className="card w-full max-w-lg bg-white shadow-2xl border border-base-300 rounded-2xl overflow-hidden z-10 text-center p-8 sm:p-12 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-success/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-[#0038A8] uppercase tracking-tight mb-2">Application Submitted!</h1>
        <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-6">DepEd Lucena City Division</p>
        
        <div className="bg-success/5 border border-success/15 rounded-xl p-4 text-xs font-medium text-success/80 mb-8 leading-relaxed max-w-sm mx-auto">
          Thank you for submitting your application. We have dispatched a confirmation receipt containing your evaluation summary to your registered email address.
        </div>

        <a 
          href="/login" 
          className="btn bg-[#0038A8] hover:bg-[#002d86] text-white border-none shadow-lg shadow-blue-900/20 rounded-xl text-xs font-black uppercase tracking-widest px-8 h-12"
        >
          Return to Login
        </a>
      </div>
    </div>
  );
};

export default ApplicationSuccess;
