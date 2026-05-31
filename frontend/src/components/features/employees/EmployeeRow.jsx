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
  const canEdit = ['ADMIN', 'HR'].includes(user?.role);

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
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] font-black opacity-20 uppercase tracking-widest">#{emp.id.toString().padStart(4, '0')}</span>
              <span className="text-[9px] font-black opacity-40 lowercase">{emp.user_details?.email || 'no-email'}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <div className="text-[11px] font-black text-base-content uppercase tracking-tight">{emp.position}</div>
          <div className="text-[10px] font-black opacity-30 uppercase tracking-widest">{emp.department}</div>
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
      <td className="px-8 py-5 text-right">
        {canEdit && (
          <div className="dropdown dropdown-bottom dropdown-end" onClick={(e) => e.stopPropagation()}>
            <label tabIndex={0} className="btn btn-ghost btn-xs btn-circle opacity-30 hover:opacity-100">
              <MoreVertical className="w-4 h-4" />
            </label>
            <ul tabIndex={0} className="dropdown-content z-[50] menu p-2 shadow-2xl bg-white rounded-lg w-36 border border-base-200 mt-1">
              <li><button className="text-[10px] font-black uppercase tracking-widest" onClick={() => onEdit(emp)}><Edit className="w-3.5 h-3.5" /> Edit</button></li>
              <li>
                <button
                  className="text-[10px] font-black uppercase tracking-widest text-error"
                  onClick={() => onDelete(emp.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </li>
            </ul>
          </div>
        )}
      </td>
    </tr>
  );
};

export default EmployeeRow;