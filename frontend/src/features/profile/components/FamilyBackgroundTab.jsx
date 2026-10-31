import React from 'react';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';

const FamilyBackgroundTab = ({ me, onAdd, onEdit, onDelete, canEdit = true }) => {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Family Background</h3>
          <p className="text-xs text-slate-500 mt-0.5">Civil Service Form 212 Section II: Immediate family members</p>
        </div>
        {canEdit && (
          <button 
            onClick={onAdd}
            className="btn btn-sm h-8 px-3 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        )}
      </div>

      {me?.family?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {me.family.map((f, idx) => (
            <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg space-y-2.5 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm text-slate-900">
                    {f.relationship === 'CHILD' ? f.full_name : `${f.first_name} ${f.surname}`}
                  </p>
                  <span className="px-2 py-0.5 bg-blue-50 text-[#0038A8] border border-blue-100 rounded text-[11px] font-semibold mt-1 inline-block">
                    {f.relationship}
                  </span>
                </div>
                
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onEdit(f, idx)}
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
              
              <div className="text-xs text-slate-600 border-t border-slate-100 pt-2 space-y-1">
                {f.occupation && (
                  <div><span className="text-slate-400">Occupation:</span> <span className="font-medium text-slate-800">{f.occupation}</span></div>
                )}
                {f.employer && (
                  <div><span className="text-slate-400">Employer:</span> <span className="font-medium text-slate-800">{f.employer}</span></div>
                )}
                {f.date_of_birth && (
                  <div><span className="text-slate-400">Birth Date:</span> <span className="font-medium text-slate-800">{new Date(f.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50/70 border border-dashed border-slate-200 rounded-lg space-y-3">
          <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">No Family Records Added</p>
            <p className="text-xs text-slate-400 mt-0.5">Immediate spouse or children information not yet submitted</p>
          </div>
          {canEdit && (
            <button 
              onClick={onAdd}
              className="btn btn-sm h-8 px-3 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-medium shadow-sm"
            >
              Add Spouse or Child
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FamilyBackgroundTab;
