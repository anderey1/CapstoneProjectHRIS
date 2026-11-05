import React from 'react';

const formatStatus = (status) => {
  if (status === 'pending_supervisor') return 'Pending Supervisor';
  if (status === 'pending_hr') return 'Pending HR';
  if (status === 'pending_superintendent') return 'Pending Superintendent';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Disapproved';
  return status;
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'pending_superintendent':
      return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
    case 'pending_hr':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'pending_supervisor':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

/**
 * Main Administrative Table for Division Leave Docket.
 */
const LeaveDocketTable = ({ filteredLeaves = [], onSelectLeave }) => {
  return (
    <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table table-xs w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider">
              <th className="py-2.5 px-3">Application ID</th>
              <th className="py-2.5 px-3">Applicant Name</th>
              <th className="py-2.5 px-3">Office / Station</th>
              <th className="py-2.5 px-3">Type of Leave</th>
              <th className="py-2.5 px-3">Inclusive Dates</th>
              <th className="py-2.5 px-3 text-right">Work Days</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave) => {
                const isActionRequired =
                  leave.can_approve &&
                  ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(
                    leave.status
                  );
                return (
                  <tr
                    key={leave.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isActionRequired ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-xs font-medium text-slate-500">
                      #{leave.id}
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-semibold text-slate-900 text-xs">
                        {leave.employee_name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Filing Date: {new Date(leave.date_applied).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-600">
                      {leave.department || 'Division Office'}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-xs text-slate-800 capitalize">
                        {leave.leave_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-xs tabular-nums text-slate-600">
                      {new Date(leave.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      <span className="mx-1 text-slate-400">→</span>
                      {new Date(leave.end_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-xs text-slate-900">
                      {leave.working_days_applied}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(
                            leave.status
                          )}`}
                        >
                          {formatStatus(leave.status)}
                        </span>
                        {isActionRequired && (
                          <span className="text-xs font-bold text-amber-700 uppercase tracking-tight">
                            ● Action Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectLeave(leave)}
                        className={`btn btn-xs rounded text-[11px] font-semibold transition-colors ${
                          isActionRequired
                            ? 'bg-[#0038a8] text-white hover:bg-[#002b80] border-none px-3'
                            : 'btn-ghost border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isActionRequired ? 'Review & Sign' : 'View Application'}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400 text-xs">
                  No leave applications matched the selected filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveDocketTable;
export { formatStatus, getStatusBadge };
