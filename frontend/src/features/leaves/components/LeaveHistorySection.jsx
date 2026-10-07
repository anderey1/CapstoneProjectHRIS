import React, { useState } from 'react';
import { Clock as ClockIcon, FileText, CheckCircle2, XCircle, Search, ExternalLink } from 'lucide-react';

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
 * LeaveHistorySection
 * High-density CSC Form No. 6 personal application history table.
 */
const LeaveHistorySection = ({ leaves }) => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeaves = leaves.filter((leave) => {
    const matchesType = filterType === 'all' || leave.leave_type === filterType;
    const matchesSearch =
      (leave.leave_type && leave.leave_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (leave.location_details && leave.location_details.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (leave.illness_details && leave.illness_details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
        <div>
          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-[#0038a8]" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Personal CSC Form No. 6 Application Ledger
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Historical audit log of all filed leave applications and certifying actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="select select-bordered select-xs h-8 text-xs font-medium bg-white border-slate-200 rounded"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Classifications</option>
            <option value="vacation">Vacation Leave</option>
            <option value="forced">Mandatory/Forced</option>
            <option value="sick">Sick Leave</option>
            <option value="maternity">Maternity Leave</option>
            <option value="paternity">Paternity Leave</option>
            <option value="special_privilege">Special Privilege</option>
            <option value="others">Others</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              className="input input-bordered input-xs h-8 pl-8 text-xs bg-white border-slate-200 rounded w-44"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Structured Ledger Table */}
      <div className="overflow-x-auto">
        <table className="table table-xs w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3">Docket ID</th>
              <th className="py-2.5 px-3">Filing Date</th>
              <th className="py-2.5 px-3">Leave Classification</th>
              <th className="py-2.5 px-3">Inclusive Dates</th>
              <th className="py-2.5 px-3 text-right">Work Days</th>
              <th className="py-2.5 px-3">Application Details / Remarks</th>
              <th className="py-2.5 px-3">Approval Stage</th>
              <th className="py-2.5 px-3 text-center">Attachments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-mono text-[11px] font-medium text-slate-500">
                    #{leave.id}
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] tabular-nums text-slate-600">
                    {new Date(leave.date_applied).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-xs text-slate-900 capitalize">
                      {leave.leave_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-[11px] tabular-nums text-slate-600">
                    {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <span className="mx-1 text-slate-400">→</span>
                    {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-xs text-slate-900">
                    {leave.working_days_applied}
                  </td>
                  <td className="py-2 px-3 text-xs max-w-xs">
                    {leave.location_details && (
                      <div className="truncate text-slate-600">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Location: </span>
                        {leave.location_details}
                      </div>
                    )}
                    {leave.illness_details && (
                      <div className="truncate text-slate-600">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Medical: </span>
                        {leave.illness_details}
                      </div>
                    )}
                    {leave.other_type_details && (
                      <div className="truncate text-slate-600">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Note: </span>
                        {leave.other_type_details}
                      </div>
                    )}
                    {leave.disapproval_reason && leave.status === 'rejected' && (
                      <div className="text-rose-700 font-medium text-[11px] mt-0.5">
                        Disapproval: "{leave.disapproval_reason}"
                      </div>
                    )}
                    {!leave.location_details && !leave.illness_details && !leave.other_type_details && !leave.disapproval_reason && (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(leave.status)}`}>
                      {leave.status === 'approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {leave.status === 'rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                      {formatStatus(leave.status)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {leave.supporting_document && (
                        <a
                          href={leave.supporting_document}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-xs text-[#0038a8] hover:bg-blue-50 px-1.5 h-6 text-[10px] font-semibold flex items-center gap-1 border border-blue-200"
                          title="View Supporting Document"
                        >
                          <FileText className="w-3 h-3" />
                          Doc
                        </a>
                      )}
                      {leave.travel_authority_document && (
                        <a
                          href={leave.travel_authority_document}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-xs text-slate-700 hover:bg-slate-100 px-1.5 h-6 text-[10px] font-semibold flex items-center gap-1 border border-slate-200"
                          title="View Travel Authority"
                        >
                          <ExternalLink className="w-3 h-3" />
                          TA
                        </a>
                      )}
                      {!leave.supporting_document && !leave.travel_authority_document && (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400 text-xs">
                  No leave application records found in your personal dossier.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveHistorySection;
