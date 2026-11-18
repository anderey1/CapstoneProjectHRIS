import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Edit } from 'lucide-react';
import { useRBAC } from '../../../hooks/useRBAC';

/**
 * Employee Row (Table Row)
 * 
 * Simple, professional redesign for the staff directory.
 */
const EmployeeRow = ({ emp, onDelete, onEdit }) => {
  const { can } = useRBAC();
  const canEdit = can('MANAGE_EMPLOYEES');

  return (
    <tr 
      className="hover:bg-slate-50/80 transition-colors border-b border-slate-200/70 last:border-0 bg-white group/row"
    >
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 border border-blue-100/80 rounded-lg flex items-center justify-center text-[#0038A8] font-bold text-xs shrink-0 group-hover/row:bg-[#0038A8] group-hover/row:text-white transition-colors">
            {emp.first_name?.[0]}{emp.last_name?.[0]}
          </div>
          <div className="min-w-0">
            <Link to={`/employees/${emp.id}`} className="inline-flex min-h-11 items-center rounded font-semibold text-sm text-primary underline underline-offset-4 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              {emp.first_name} {emp.last_name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <span className="font-mono text-xs text-slate-600">#{emp.id.toString().padStart(4, '0')}</span>
              <span>•</span>
              <span className="truncate">{emp.user_details?.email || 'No email'}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-3.5">
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-slate-800">{emp.position || 'Position not recorded'}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {[emp.department, emp.school_details?.name].filter(Boolean).join(' • ') || 'Workplace not recorded'}
          </div>
        </div>
      </td>
      <td className="px-6 py-3.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          {emp.leave_balance != null ? `${emp.leave_balance} credits` : 'Not recorded'}
        </span>
      </td>
      <td className="px-6 py-3.5 text-xs text-slate-600 font-medium">
        {emp.date_hired ? new Date(emp.date_hired).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'}
      </td>
      <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
        {canEdit && (
          <div className="flex justify-end gap-1">
            <button 
              className="btn btn-ghost min-h-11 min-w-11 px-3 text-sm font-medium text-slate-700 hover:text-[#0038A8] hover:bg-slate-100 rounded-md"
              onClick={() => onEdit(emp)}
              title="Edit Staff"
            >
              <Edit className="w-3.5 h-3.5 mr-1 text-slate-400" /> Edit
            </button>
            <button 
              className="btn btn-ghost min-h-11 min-w-11 px-3 text-sm font-medium text-red-700 hover:bg-red-50 rounded-md"
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
