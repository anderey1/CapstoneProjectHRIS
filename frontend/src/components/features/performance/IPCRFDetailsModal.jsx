import React from 'react';
import { X, Award, Target, TrendingUp, UserCheck, ShieldCheck } from 'lucide-react';

const IPCRFDetailsModal = ({ review, onClose }) => {
  if (!review) return null;

  const avg = (review.punctuality_score + review.quality_score + review.behavior_score) / 3;

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-[2.5rem] max-w-2xl p-0 overflow-hidden border border-base-300 shadow-2xl">
        {/* Header - Government Style */}
        <div className="bg-primary p-8 text-white text-center relative">
          <button onClick={onClose} className="absolute right-6 top-6 btn btn-ghost btn-circle btn-sm text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-4">
             <div className="p-3 bg-white/20 rounded-full">
                <Award className="w-10 h-10" />
             </div>
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest">Individual Performance Commitment and Review Form</h2>
          <p className="text-[10px] font-bold opacity-70 mt-1">Department of Education - Schools Division Office of Lucena City</p>
        </div>

        <div className="p-8 space-y-8 bg-base-100">
           {/* Employee Header */}
           <div className="flex justify-between items-end border-b border-base-200 pb-4">
              <div>
                 <p className="text-[10px] font-black uppercase opacity-40">Employee Name</p>
                 <h3 className="text-2xl font-black text-primary">{review.employee_name}</h3>
                 <p className="text-xs font-bold opacity-60">{review.department}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase opacity-40">Evaluation Period</p>
                 <p className="text-sm font-black">{review.period}</p>
              </div>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-base-200/50 p-6 rounded-3xl border border-base-300 relative overflow-hidden">
                 <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-success" />
                    <span className="text-[10px] font-black uppercase opacity-50">Punctuality</span>
                 </div>
                 <p className="text-4xl font-black">{review.punctuality_score}.0</p>
                 <div className="absolute -bottom-2 -right-2 opacity-5">
                    <Target className="w-20 h-20" />
                 </div>
              </div>

              <div className="card bg-base-200/50 p-6 rounded-3xl border border-base-300 relative overflow-hidden">
                 <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-info" />
                    <span className="text-[10px] font-black uppercase opacity-50">Quality of Work</span>
                 </div>
                 <p className="text-4xl font-black">{review.quality_score}.0</p>
                 <div className="absolute -bottom-2 -right-2 opacity-5">
                    <ShieldCheck className="w-20 h-20" />
                 </div>
              </div>

              <div className="card bg-base-200/50 p-6 rounded-3xl border border-base-300 relative overflow-hidden">
                 <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-4 h-4 text-warning" />
                    <span className="text-[10px] font-black uppercase opacity-50">Behavior</span>
                 </div>
                 <p className="text-4xl font-black">{review.behavior_score}.0</p>
                 <div className="absolute -bottom-2 -right-2 opacity-5">
                    <Award className="w-20 h-20" />
                 </div>
              </div>
           </div>

           {/* Summary Section */}
           <div className="bg-base-200/50 p-8 rounded-[2rem] border border-base-300 relative">
              <h4 className="text-xs font-black uppercase opacity-40 mb-4 tracking-widest">Administrative Summary</h4>
              <p className="text-lg italic font-medium leading-relaxed">
                 "{review.ai_summary}"
              </p>
              
              <div className="mt-8 pt-8 border-t border-base-300 flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-black uppercase opacity-40">Final Numerical Rating</p>
                    <p className="text-3xl font-black text-primary">{avg.toFixed(2)}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black uppercase opacity-40">Promotion Eligibility</p>
                    <span className={`badge badge-lg font-black ${review.is_promotion_eligible ? 'badge-success text-white' : 'badge-ghost opacity-50'}`}>
                       {review.is_promotion_eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                    </span>
                 </div>
              </div>
           </div>

           <div className="text-center opacity-30">
              <p className="text-[8px] font-bold uppercase tracking-[0.3em]">Official Digital Document - DepEd HRIS Lucena City</p>
           </div>
        </div>

        <div className="p-6 bg-base-200 flex justify-end gap-3">
           <button onClick={() => window.print()} className="btn btn-primary rounded-xl px-8">Print Official Copy</button>
           <button onClick={onClose} className="btn btn-ghost rounded-xl px-8">Close</button>
        </div>
      </div>
      <div className="modal-backdrop bg-neutral/50" onClick={onClose}></div>
    </div>
  );
};

// Simple icons fallback if Lucide is missing some
const Clock = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

export default IPCRFDetailsModal;
