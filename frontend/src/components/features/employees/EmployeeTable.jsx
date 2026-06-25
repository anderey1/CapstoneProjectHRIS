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
  const canEdit = ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'].includes(user?.role);

  return (
    <div className="space-y-6">
      
      {/* Mobile Card List (< lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
        {employees.length > 0 ? (
          employees.map((emp) => (
            <div 
              key={emp.id} 
              onClick={() => navigate(`/employees/${emp.id}`)}
              className="bg-white p-6 rounded-xl shadow-sm border border-base-200 flex flex-col gap-4 group hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/5 border border-primary/5 rounded-xl flex items-center justify-center text-primary font-black uppercase text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-black text-sm text-base-content uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{emp.first_name} {emp.last_name}</h3>
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">#{emp.id.toString().padStart(4, '0')}</p>
                  </div>
                </div>
                
                {canEdit && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-wider px-2"
                      onClick={() => onEdit(emp)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </button>
                    <button 
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10 font-black uppercase text-[10px] tracking-wider px-2"
                      onClick={() => onDelete(emp.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-base-50 p-2.5 rounded-lg border border-base-100 overflow-hidden">
                  <Briefcase className="w-3.5 h-3.5 opacity-30" />
                  <span className="text-[10px] font-bold text-base-content/60 uppercase truncate">{emp.position} ({emp.department})</span>
                </div>
                <div className="flex items-center gap-2 bg-base-50 p-2.5 rounded-lg border border-base-100 overflow-hidden">
                  <Building2 className="w-3.5 h-3.5 opacity-30" />
                  <span className="text-[10px] font-bold text-base-content/60 uppercase truncate">{emp.school_details?.name || 'Division Office'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-base-100 pt-4 mt-2">
                <div className="space-y-1">
                   <span className="text-[9px] font-black uppercase opacity-20 tracking-widest">Balance</span>
                   <p className="text-[11px] font-black text-primary uppercase">{Math.floor(emp.leave_balance)} Days</p>
                </div>
                <div className="text-right space-y-1">
                   <span className="text-[9px] font-black uppercase opacity-20 tracking-widest">Joined</span>
                   <p className="text-[11px] font-black text-base-content/60">{emp.date_hired || '---'}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-xl border border-dashed border-base-300 flex flex-col items-center justify-center opacity-30">
             <User className="w-8 h-8 mb-2" />
             <p className="text-xs font-black uppercase tracking-widest">No staff found</p>
          </div>
        )}
      </div>

      {/* Desktop Table View (>= lg) */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
        <table className="table table-sm w-full">
          <thead>
            <tr className="bg-base-50/50 border-b border-base-100 uppercase text-[10px] tracking-widest font-black opacity-50">
              <th className="px-8 py-5 text-primary">Staff Member</th>
              <th>Role & Area</th>
              <th>Leave Credits</th>
              <th>Joined Date</th>
              <th className="px-8 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-50">
            {employees.length > 0 ? (
              employees.map((emp) => (
                <EmployeeRow key={emp.id} emp={emp} onDelete={onDelete} onEdit={onEdit} />
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-20 opacity-30 italic font-black uppercase tracking-widest">
                  No records found
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
