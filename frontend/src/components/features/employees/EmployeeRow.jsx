import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Briefcase, Building2, Trash2, Edit, Calendar, Heart, Plane } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

/**
 * Employee Row (Table Row)
 * 
 * Simple, professional redesign for the staff directory.
 */
const EmployeeRow = ({ emp, onDelete, onEdit }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'].includes(user?.role);

  const handleRowClick = () => {
    navigate(`/employees/${emp.id}`);
  };

  return (
    <tr 
      onClick={handleRowClick}
      className="hover:bg-primary/5 transition-all border-b border-base-50 last:border-0 bg-white cursor-pointer group/row"
    >
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/5 border border-primary/5 rounded-lg flex items-center justify-center text-primary font-black uppercase text-xs group-hover/row:bg-primary group-hover/row:text-white transition-colors">
            {emp.first_name[0]}{emp.last_name[0]}
          </div>
          <div>
            <div className="font-black text-sm text-base-content uppercase tracking-tight leading-tight group-hover/row:text-primary transition-colors">
              {emp.first_name} {emp.last_name}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">#{emp.id.toString().padStart(4, '0')}</span>
              {emp.agency_employee_no && (
                <span className="text-[8px] font-black text-[#0038A8] uppercase bg-[#0038A8]/10 px-1.5 py-0.5 rounded">
                  No: {emp.agency_employee_no}
                </span>
              )}
              <span className="text-[9px] font-black opacity-40 lowercase">{emp.user_details?.email || 'no-email'}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <div className="text-[11px] font-black text-base-content uppercase tracking-tight">{emp.position}</div>
          <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">
            {emp.department} • {emp.school_details?.name || 'Division Office'}
          </div>
        </div>
      </td>
      <td className="px-6 py-5 text-[11px] font-black text-primary uppercase tracking-tighter">
        {Math.floor(emp.leave_balance)} Credits
      </td>
      <td className="px-6 py-5">
        <div className="text-xs font-bold text-base-content/50 uppercase tracking-tighter">
          {emp.date_hired ? new Date(emp.date_hired).toLocaleDateString() : '---'}
        </div>
      </td>
      <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
        {canEdit && (
          <div className="flex justify-end gap-1">
            <button 
              className="btn btn-ghost btn-xs text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-wider px-3"
              onClick={() => onEdit(emp)}
            >
              <Edit className="w-3.5 h-3.5 mr-1" /> Edit
            </button>
            <button 
              className="btn btn-ghost btn-xs text-error hover:bg-error/10 font-black uppercase text-[10px] tracking-wider px-3"
              onClick={() => onDelete(emp.id)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default EmployeeRow;