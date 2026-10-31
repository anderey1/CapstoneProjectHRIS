import React from 'react';
import { Award, Plus, Pencil, Trash2 } from 'lucide-react';

const CivilServiceEligibilityTab = ({ me, onAdd, onEdit, onDelete, canEdit = true }) => {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Eligibility & Certifications</h3>
          <p className="text-xs text-slate-500 mt-0.5">Civil Service Form 212 Section IV: CSC and Board exam credentials</p>
        </div>
        {canEdit && (
          <button 
            onClick={onAdd}
            className="btn btn-sm h-8 px-3 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Certification
          </button>
        )}
      </div>

      {me?.eligibilities?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {me.eligibilities.map((el, idx) => (
            <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg relative space-y-2.5 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-semibold text-sm text-slate-900 pr-6">{el.service}</p>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[11px] font-semibold mt-1 inline-block">
                    Rating: {el.rating || 'Passed'}%
                  </span>
                </div>
                
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onEdit(el, idx)}
                      className="btn btn-ghost btn-xs h-7 text-slate-500 hover:text-slate-800"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => onDelete(idx)}
                      className="btn btn-ghost btn-xs h-7 text-red-500 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
                {el.date_of_exam && <p><span className="text-slate-400">Exam Date:</span> <span className="font-medium text-slate-800">{new Date(el.date_of_exam).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></p>}
                {el.place_of_exam && <p><span className="text-slate-400">Exam Center:</span> <span className="font-medium text-slate-800">{el.place_of_exam}</span></p>}
                {el.license_no && <p><span className="text-slate-400">License No:</span> <span className="font-mono text-slate-800 font-medium">{el.license_no}</span></p>}
                {el.license_date && <p><span className="text-slate-400">Validity:</span> <span className="font-medium text-slate-800">{new Date(el.license_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50/70 border border-dashed border-slate-200 rounded-lg space-y-3">
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400 shadow-sm">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">No Eligibility Credentials Registered</p>
            <p className="text-xs text-slate-400 mt-0.5">Civil Service eligibility or professional board licenses not yet recorded</p>
          </div>
          {canEdit && (
            <button 
              onClick={onAdd}
              className="btn btn-sm h-8 px-3 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-medium shadow-sm"
            >
              Add Board or CSC Exam
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CivilServiceEligibilityTab;
