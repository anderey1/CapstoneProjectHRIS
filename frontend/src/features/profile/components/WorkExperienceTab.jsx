import React from 'react';
import { History, Plus, Pencil, Trash2 } from 'lucide-react';

const WorkExperienceTab = ({ me, onAdd, onEdit, onDelete, canEdit = true }) => {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Work History & Experience</h3>
          <p className="text-xs text-slate-500 mt-0.5">Civil Service Form 212 Section V: Past employment records</p>
        </div>
        {canEdit && (
          <button 
            onClick={onAdd}
            className="btn btn-sm h-8 px-3 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Experience
          </button>
        )}
      </div>

      {me?.work_experience?.length > 0 ? (
        <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 ml-2 py-1">
          {me.work_experience.map((w, idx) => (
            <div key={idx} className="relative p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors shadow-sm space-y-2.5">
              <div className="absolute w-2.5 h-2.5 bg-[#0038A8] rounded-full -left-[22px] top-5 border-2 border-white ring-2 ring-slate-100"></div>
              
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {w.date_from ? new Date(w.date_from).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : ''} — {w.is_present ? 'Present' : (w.date_to ? new Date(w.date_to).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : '')}
                  </span>
                  <h4 className="font-semibold text-sm text-slate-900 mt-1.5">
                    {w.position_title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {w.agency}
                  </p>
                </div>
                
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onEdit(w, idx)}
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
              
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600 pt-2.5 border-t border-slate-100">
                <span>Monthly: <strong className="font-semibold text-slate-800">₱{parseFloat(w.monthly_salary || 0).toLocaleString()}</strong></span>
                {w.salary_grade && (
                  <span className="bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded text-xs font-medium">
                    Salary Grade {w.salary_grade}
                  </span>
                )}
                <span>Service: <strong className="font-medium text-slate-700">{w.is_gov_service ? 'Government' : 'Private'}</strong></span>
                <span>Status: <strong className="font-medium text-slate-700">{w.status_of_appointment}</strong></span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50/70 border border-dashed border-slate-200 rounded-lg space-y-3">
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400 shadow-sm">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">No Work History Records</p>
            <p className="text-xs text-slate-400 mt-0.5">Government or private employment history not yet recorded</p>
          </div>
          {canEdit && (
            <button 
              onClick={onAdd}
              className="btn btn-sm h-8 px-3 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-medium shadow-sm"
            >
              Add Job Record
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkExperienceTab;
