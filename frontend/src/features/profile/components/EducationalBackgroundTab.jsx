import React from 'react';
import { GraduationCap, Plus, Pencil, Trash2, Sparkles } from 'lucide-react';

const EducationalBackgroundTab = ({ me, onAdd, onEdit, onDelete, canEdit = true }) => {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Educational Background</h3>
          <p className="text-xs text-slate-500 mt-0.5">Civil Service Form 212 Section III: Formal education & degrees</p>
        </div>
        {canEdit && (
          <button 
            onClick={onAdd}
            className="btn btn-sm h-8 px-3 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Education
          </button>
        )}
      </div>

      {me?.education?.length > 0 ? (
        <div className="space-y-3">
          {me.education.map((e, idx) => (
            <div key={idx} className="flex gap-3.5 p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0038A8] flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-blue-100">
                {e.level?.charAt(0) || 'E'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-900">
                      {e.school_name}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      {e.degree_course || 'Basic Education / Secondary'}
                    </p>
                  </div>
                  
                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => onEdit(e, idx)}
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
                
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 mt-3 border-t border-slate-100 pt-2.5">
                  <span>Level: <strong className="text-slate-700 font-medium">{e.level?.replace('_', ' ')}</strong></span>
                  <span>Period: <strong className="text-slate-700 font-medium">{e.period_from || '---'} to {e.period_to || '---'}</strong></span>
                  {e.year_graduated && <span>Graduated: <strong className="text-slate-700 font-medium">{e.year_graduated}</strong></span>}
                  {e.honors_received && (
                    <span className="text-emerald-700 font-medium text-xs px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {e.honors_received}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50/70 border border-dashed border-slate-200 rounded-lg space-y-3">
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400 shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">No Education Credentials Added</p>
            <p className="text-xs text-slate-400 mt-0.5">Schools, inclusive attendance periods, and degrees not registered</p>
          </div>
          {canEdit && (
            <button 
              onClick={onAdd}
              className="btn btn-sm h-8 px-3 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-medium shadow-sm"
            >
              Add Degree or School
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EducationalBackgroundTab;
