import React from 'react';
import EmployeeRow from './EmployeeRow';

const EmployeeTable = ({ employees, onDelete, onEdit }) => {
  return (
    <div className="bg-base-100 rounded-[2.5rem] shadow-xl border border-base-300">
      <div className="overflow-visible">
        <table className="table table-zebra w-full overflow-visible">
          <thead className="bg-base-200/50">
            <tr className="border-b border-base-300 uppercase text-[10px] tracking-widest font-black opacity-50">
              <th className="px-6 py-4 text-left">Employee</th>
              <th className="px-6 py-4 text-left">Position & Dept</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-left">Date Hired</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? (
              employees.map((emp) => (
                <EmployeeRow key={emp.id} emp={emp} onDelete={onDelete} onEdit={onEdit} />
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-20 opacity-30 italic font-medium">
                  No employees found in the records.
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
