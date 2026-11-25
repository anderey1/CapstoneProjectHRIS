import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ApplicationSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] relative overflow-hidden p-6">
      <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
      
      <div className="card w-full max-w-lg bg-white shadow-lg border border-slate-200 rounded-xl overflow-hidden z-10 text-center p-8 sm:p-12">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-semibold text-primary tracking-tight mb-2">Application Submitted!</h1>
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-6">DepEd Lucena City Division</p>
        
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-700 mb-8 leading-relaxed max-w-sm mx-auto">
          Your application has been submitted.
        </div>

        <a 
          href="/login" 
          className="btn btn-primary px-8 h-12 text-xs font-semibold uppercase tracking-wide"
        >
          Return to Login
        </a>
      </div>
    </div>
  );
};

export default ApplicationSuccess;
