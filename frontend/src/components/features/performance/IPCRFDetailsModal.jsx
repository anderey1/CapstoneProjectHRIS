import React from 'react';
import { X, Award, Target, TrendingUp, UserCheck, ShieldCheck, FileText, Printer, Clock, Download } from 'lucide-react';

/**
 * Performance Details Modal (IPCRF View)
 * 
 * Simple, professional redesign for viewing evaluation results.
 */
const IPCRFDetailsModal = ({ review, onClose }) => {
  if (!review) return null;

  const scores = [review.punctuality_score, review.quality_score, review.behavior_score].filter(s => s !== null && s !== undefined);
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-xl max-w-2xl p-0 overflow-hidden border border-base-200 shadow-2xl bg-white animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-primary p-10 text-white text-center relative">
          <button onClick={onClose} className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <FileText className="w-8 h-8" />
             </div>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Performance Report</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">DepEd Schools Division Office — Lucena City</p>
        </div>

        <div className="p-8 space-y-8">
           {/* Employee & Period */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-base-50 pb-6 gap-4">
              <div>
                 <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Employee</p>
                 <h3 className="text-2xl font-black text-base-content uppercase tracking-tight">{review.employee_name}</h3>
                 <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mt-0.5">{review.department}</p>
              </div>
              <div className="text-left md:text-right">
                 <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Period</p>
                 <p className="text-sm font-black text-primary uppercase">{review.period}</p>
              </div>
           </div>

           {/* Metrics Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-base-50 p-6 rounded-xl border border-base-100 relative overflow-hidden group">
                 <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-3.5 h-3.5 text-success" />
                    <span className="text-[9px] font-black uppercase opacity-40 tracking-widest">Punctual</span>
                 </div>
                 <p className="text-4xl font-black text-base-content">{review.punctuality_score !== null ? `${review.punctuality_score}.0` : 'N/A'}</p>
              </div>

              <div className="bg-base-50 p-6 rounded-xl border border-base-100 relative overflow-hidden group">
                 <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[9px] font-black uppercase opacity-40 tracking-widest">Quality</span>
                 </div>
                 <p className="text-4xl font-black text-base-content">{review.quality_score !== null ? `${review.quality_score}.0` : 'N/A'}</p>
              </div>

              <div className="bg-base-50 p-6 rounded-xl border border-base-100 relative overflow-hidden group">
                 <div className="flex items-center gap-2 mb-4">
                    <UserCheck className="w-3.5 h-3.5 text-warning" />
                    <span className="text-[9px] font-black uppercase opacity-40 tracking-widest">Behavior</span>
                 </div>
                 <p className="text-4xl font-black text-base-content">{review.behavior_score !== null ? `${review.behavior_score}.0` : 'N/A'}</p>
              </div>
           </div>

           {/* Executive Summary & IPCRF File */}
           <div className="bg-white p-8 rounded-xl border border-base-200 shadow-inner space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary opacity-40" />
                  <h4 className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em]">Summary</h4>
                </div>
                {review.ipcrf_file && (
                  <a 
                    href={review.ipcrf_file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary/10 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Download IPCRF File
                  </a>
                )}
              </div>
              
              <p className="text-lg font-bold text-base-content leading-relaxed italic">
                 "{review.ai_summary || (review.ipcrf_file ? 'IPCRF document uploaded for review.' : 'No evaluation summary available.')}"
              </p>
              
              <div className="mt-8 pt-8 border-t border-base-100 flex justify-between items-center">
                 <div>
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-1">Overall Rating</p>
                    <p className="text-4xl font-black text-primary tracking-tighter">{avg > 0 ? avg.toFixed(2) : 'N/A'}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black uppercase opacity-30 tracking-widest mb-2">Eligibility</p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] ${review.is_promotion_eligible ? 'bg-success/10 text-success' : 'bg-base-50 text-base-content/30'}`}>
                       {review.is_promotion_eligible ? 'PROMOTABLE' : 'REGULAR'}
                    </span>
                 </div>
              </div>
           </div>

           <div className="text-center opacity-20">
              <p className="text-[8px] font-black uppercase tracking-[0.4em]">Official System Record • No Signature Required</p>
           </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 bg-base-50/50 border-t border-base-100 flex justify-end gap-3">
           <button onClick={onClose} className="btn btn-ghost text-[10px] font-black uppercase tracking-widest opacity-40">Close</button>
           <button onClick={() => window.print()} className="btn btn-primary rounded-lg px-8 text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20">
              <Printer className="w-3.5 h-3.5 mr-2" />
              Print Report
           </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default IPCRFDetailsModal;
