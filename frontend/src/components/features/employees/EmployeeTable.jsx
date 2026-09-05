import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, MoreVertical, Briefcase, Building2, Calendar, User } from 'lucide-react';
import EmployeeRow from './EmployeeRow';
import { useAuth } from '../../../context/AuthContext';

/**
 * Employee Table (Staff Directory)
 * 
 * Simple, professional redesign with high-density data display.
 */
const EmployeeTable = ({ employees, onDelete, onEdit }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = ['HR', 'SUPERINTENDENT'].includes(user?.role);

  return (
    <div className="space-y-6">
      
      {/* Mobile Card List (< lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 lg:hidden">
        {employees.length > 0 ? (
          employees.map((emp) => (
            <div 
              key={emp.id} 
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3.5 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#0038A8] font-bold text-xs shrink-0">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 leading-tight">{emp.first_name} {emp.last_name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-400 font-mono">#{emp.id.toString().padStart(4, '0')}</span>
                      {emp.agency_employee_no && (
                        <span className="text-[10px] font-medium text-[#0038A8] bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                          No: {emp.agency_employee_no}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {canEdit && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn btn-ghost btn-xs h-7 text-slate-600 hover:text-[#0038A8] font-medium text-xs px-2"
                      onClick={() => onEdit(emp)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1 text-slate-400" /> Edit
                    </button>
                    <button 
                      className="btn btn-ghost btn-xs h-7 text-red-600 hover:bg-red-50 font-medium text-xs px-2"
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
                  <span className="font-medium text-slate-800 truncate">{emp.position || 'Teacher I'} ({emp.department})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 truncate">{emp.school_details?.name || 'Division Office'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <div>
                   <span className="text-slate-400 font-medium">Leave Credits</span>
                   <p className="font-semibold text-slate-800 mt-0.5">{Math.floor(emp.leave_balance || 0)} days</p>
                </div>
                <div className="text-right">
                   <span className="text-slate-400 font-medium">Appointed</span>
                   <p className="font-medium text-slate-700 mt-0.5">{emp.date_hired || '---'}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
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
                <td colSpan="5" className="text-center py-16 text-xs text-slate-400 italic">
                  No employee records match the current criteria
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
