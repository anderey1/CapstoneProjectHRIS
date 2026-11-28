import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Briefcase, Building2, User } from 'lucide-react';
import EmployeeRow from './EmployeeRow';
import { useRBAC } from '../../../hooks/useRBAC';

/**
 * Employee Table (Staff Directory)
 * 
 * Simple, professional redesign with high-density data display.
 */
const EmployeeTable = ({ employees, onDelete, onEdit }) => {
  const { can } = useRBAC();
  const canEdit = can('MANAGE_EMPLOYEES');

  return (
    <div className="space-y-6">
      
      {/* Mobile Card List (< lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
        {employees.length > 0 ? (
          employees.map((emp) => (
            <div 
              key={emp.id} 
              className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-3.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <h3><Link to={`/employees/${emp.id}`} className="inline-flex min-h-11 items-center rounded font-semibold text-sm text-primary underline underline-offset-4 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{emp.first_name} {emp.last_name}</Link></h3>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">#{emp.id.toString().padStart(4, '0')}</p>
                  </div>
                </div>
                
                {canEdit && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn btn-ghost min-h-11 min-w-11 text-slate-700 hover:text-primary font-medium text-sm px-3"
                      onClick={() => onEdit(emp)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1 text-slate-400" /> Edit
                    </button>
                    <button 
                      className="btn btn-ghost min-h-11 min-w-11 text-red-700 hover:bg-red-50 font-medium text-sm px-3"
                      onClick={() => onDelete(emp.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1 text-red-400" /> Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                   <span className="font-medium text-slate-800 break-words">{emp.position || 'Position not recorded'}{emp.department ? ` (${emp.department})` : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                   <span className="text-slate-600 break-words">{emp.school_details?.name || 'Workplace not recorded'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <div>
                   <span className="text-slate-600 font-medium">Leave credits</span>
                   <p className="font-semibold text-slate-800 mt-0.5">{emp.leave_balance != null ? `${emp.leave_balance} days` : 'Not recorded'}</p>
                </div>
                <div className="text-right">
                   <span className="text-slate-600 font-medium">Appointed</span>
                   <p className="font-medium text-slate-700 mt-0.5">{emp.date_hired || '---'}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
           <div className="col-span-full py-16 bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-600">
             <User className="w-8 h-8 mb-2 stroke-1" />
             <p className="text-xs font-medium">No personnel records found</p>
          </div>
        )}
      </div>

      {/* Desktop Table View (>= lg) */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <th className="px-6 py-3.5">Staff Member</th>
              <th className="px-6 py-3.5">Position & Station</th>
              <th className="px-6 py-3.5">Leave Credits</th>
              <th className="px-6 py-3.5">Date Appointed</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.length > 0 ? (
              employees.map((emp) => (
                <EmployeeRow key={emp.id} emp={emp} onDelete={onDelete} onEdit={onEdit} />
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-16 text-sm text-slate-600">
                  No employees match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeTable;
