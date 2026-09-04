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
  const canEdit = ['HR', 'SUPERINTENDENT'].includes(user?.role);

  const handleRowClick = () => {
    navigate(`/employees/${emp.id}`);
  };

  return (
    <tr 
      onClick={handleRowClick}
      className="hover:bg-slate-50/80 transition-colors border-b border-slate-200/70 last:border-0 bg-white cursor-pointer group/row"
    >
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 border border-blue-100/80 rounded-lg flex items-center justify-center text-[#0038A8] font-bold text-xs shrink-0 group-hover/row:bg-[#0038A8] group-hover/row:text-white transition-colors">
            {emp.first_name?.[0]}{emp.last_name?.[0]}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-slate-900 leading-tight group-hover/row:text-[#0038A8] transition-colors">
              {emp.first_name} {emp.last_name}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="font-mono text-[11px] text-slate-400">#{emp.id.toString().padStart(4, '0')}</span>
              <span>•</span>
              <span className="truncate">{emp.user_details?.email || 'No email'}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-3.5">
        <div className="flex flex-col">
          <div className="text-xs font-semibold text-slate-800">{emp.position || 'Teacher I'}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {emp.department} • {emp.school_details?.name || 'Division Office'}
          </div>
        </div>
      </td>
      <td className="px-6 py-3.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {Math.floor(emp.leave_balance || 0)} credits
        </span>
      </td>
      <td className="px-6 py-3.5 text-xs text-slate-600 font-medium">
        {emp.date_hired ? new Date(emp.date_hired).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'}
      </td>
      <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
        {canEdit && (
          <div className="flex justify-end gap-1">
            <button 
              className="btn btn-ghost btn-xs h-7 px-2.5 text-xs font-medium text-slate-600 hover:text-[#0038A8] hover:bg-slate-100 rounded-md"
              onClick={() => onEdit(emp)}
              title="Edit Staff"
            >
              <Edit className="w-3.5 h-3.5 mr-1 text-slate-400" /> Edit
            </button>
            <button 
              className="btn btn-ghost btn-xs h-7 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
              onClick={() => onDelete(emp.id)}
              title="Delete Staff"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1 text-red-400" /> Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};

export default EmployeeRow;