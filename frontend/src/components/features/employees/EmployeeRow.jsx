import React from 'react';
import { MoreVertical, Briefcase, Building2, Trash2, Edit, Calendar, Heart, Plane } from 'lucide-react';

const EmployeeRow = ({ emp, onDelete, onEdit }) => {
  return (
    <tr className="hover:bg-gray-50 transition-colors border-b border-base-200 last:border-0 bg-white">
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="avatar placeholder">
            <div className="bg-primary text-white rounded-xl w-10 h-10 font-bold uppercase flex items-center justify-center text-sm">
              {emp.first_name[0]}{emp.last_name[0]}
            </div>
          </div>
          <div>
            <div className="font-bold text-base-content text-base">
              {emp.first_name} {emp.last_name}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400">#{emp.id.toString().padStart(4, '0')}</span>
              <span className="text-[10px] opacity-60">{emp.user_details?.email || 'No email'}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-gray-700">{emp.position}</div>
          <div className="text-xs text-gray-400 font-medium">{emp.department}</div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-secondary">{Math.floor(emp.sick_leave_balance)} Sick</span>
            <span className="text-xs font-bold text-primary">{Math.floor(emp.vacation_leave_balance)} Vac.</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="text-sm font-medium text-gray-600">
          {emp.date_hired ? new Date(emp.date_hired).toLocaleDateString() : '---'}
        </div>
      </td>
      <td className="px-6 py-5 text-right">
        <div className="dropdown dropdown-bottom dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
            <MoreVertical className="w-5 h-5 opacity-40" />
          </label>
          <ul tabIndex={0} className="dropdown-content z-[50] menu p-2 shadow-lg bg-white rounded-lg w-48 border border-base-200 mt-1">
            <li><button className="text-sm font-semibold" onClick={() => onEdit(emp)}><Edit className="w-4 h-4" /> Edit Profile</button></li>
            <li>
              <button
                className="text-sm font-semibold text-error"
                onClick={() => onDelete(emp.id)}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </li>
          </ul>
        </div>
      </td>
    </tr>
  );
};

export default EmployeeRow;