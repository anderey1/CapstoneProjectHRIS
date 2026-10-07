import React, { useState } from 'react';
import { 
  XCircle, AlertCircle, Search
} from 'lucide-react';
import DocumentAttachmentCard, { CSC_DOCUMENT_SPECS } from './DocumentAttachmentCard';

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
 * SupervisorApprovalQueue
 * Institutional table docket for supervisors and managers to review and sign endorsements.
 */
const SupervisorApprovalQueue = ({ 
  teamLeaves, 
  onApprove, 
  onReject, 
  isApprovePending, 
  isRejectPending 
}) => {
  const [approvalTab, setApprovalTab] = useState('pending'); // 'pending', 'accepted', 'rejected', 'all'
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeamLeaves = teamLeaves.filter(l => {
    let matchesTab = true;
    if (approvalTab === 'pending') matchesTab = ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(l.status);
    else if (approvalTab === 'accepted') matchesTab = l.status === 'approved';
    else if (approvalTab === 'rejected') matchesTab = l.status === 'rejected';

    const matchesSearch = 
      (l.employee_name && l.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.leave_type && l.leave_type.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const pendingActionRequiredCount = teamLeaves.filter(l => l.can_approve && ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(l.status)).length;
  const totalPendingCount = teamLeaves.filter(l => ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(l.status)).length;
  const approvedCount = teamLeaves.filter(l => l.status === 'approved').length;
  const rejectedCount = teamLeaves.filter(l => l.status === 'rejected').length;

  return (
    <div className="space-y-4">
      {/* Alert banner if actions needed */}
      {pendingActionRequiredCount > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2 rounded text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>You have <strong>{pendingActionRequiredCount}</strong> subordinate application(s) awaiting your endorsement/decision.</span>
          </div>
          <span className="font-mono text-[11px] text-amber-700 uppercase font-semibold">Immediate Action</span>
        </div>
      )}

      {/* Control Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              approvalTab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setApprovalTab('pending')}
          >
            Pending Endorsement ({totalPendingCount})
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              approvalTab === 'accepted'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setApprovalTab('accepted')}
          >
            Approved ({approvedCount})
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              approvalTab === 'rejected'
                ? 'bg-white text-rose-800 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setApprovalTab('rejected')}
          >
            Disapproved ({rejectedCount})
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search subordinate name..."
            className="input input-bordered input-xs h-8 pl-8 text-xs bg-white border-slate-200 rounded w-52"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Subordinates Docket Table */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-xs w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Docket ID</th>
                <th className="py-2.5 px-3">Applicant Name</th>
                <th className="py-2.5 px-3">Leave Classification</th>
                <th className="py-2.5 px-3">Inclusive Dates</th>
                <th className="py-2.5 px-3 text-right">Work Days</th>
                <th className="py-2.5 px-3">Stage / Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeamLeaves.length > 0 ? (
                filteredTeamLeaves.map((leave) => {
                  const isActionRequired = leave.can_approve && ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(leave.status);
                  return (
                    <tr 
                      key={leave.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isActionRequired ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="py-2 px-3 font-mono text-[11px] font-medium text-slate-500">
                        #{leave.id}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900 text-xs">{leave.employee_name}</div>
                        <div className="text-[10px] text-slate-400">{leave.department || 'School / Section'}</div>
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-xs text-slate-800 capitalize">
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
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(leave.status)}`}>
                          {formatStatus(leave.status)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedApproval(leave)}
                          className={`btn btn-xs rounded text-[11px] font-semibold transition-colors ${
                            isActionRequired
                              ? 'bg-[#0038a8] text-white hover:bg-[#002b80] border-none px-3'
                              : 'btn-ghost border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isActionRequired ? 'Review & Endorse' : 'View Docket'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 text-xs">
                    No team leave applications in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Endorsement Modal */}
      {selectedApproval && (
        <div className="modal modal-open">
          <div className="modal-box rounded-lg max-w-3xl p-0 overflow-hidden shadow-xl border border-slate-300 bg-white h-[85vh] flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#0038a8] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    CSC Form No. 6 Endorsement
                  </span>
                  <span className="text-xs font-mono text-slate-500">Docket #{selectedApproval.id}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 mt-0.5">
                  Leave Review — {selectedApproval.employee_name}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setSelectedApproval(null); setRejectionReason(''); }} 
                className="btn btn-ghost btn-xs btn-circle text-slate-500 hover:text-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-white text-slate-800 text-xs">
              {/* Application Details Summary */}
              <div className="border border-slate-200 rounded p-4 bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Leave Classification</span>
                  <span className="font-bold text-slate-900 capitalize text-sm">{selectedApproval.leave_type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Inclusive Dates</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 text-xs">
                    {new Date(selectedApproval.start_date).toLocaleDateString()} — {new Date(selectedApproval.end_date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Work Days Count</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">{selectedApproval.working_days_applied} Days</span>
                </div>
              </div>

              {/* Specifics */}
              {(selectedApproval.location_details || selectedApproval.illness_details) && (
                <div className="border border-slate-200 rounded p-3 bg-white space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Application Specification</span>
                  {selectedApproval.location_details && (
                    <p className="text-xs text-slate-700">
                      <strong>Location:</strong> {selectedApproval.is_within_philippines ? 'Philippines' : 'Abroad'} — {selectedApproval.location_details}
                    </p>
                  )}
                  {selectedApproval.illness_details && (
                    <p className="text-xs text-slate-700">
                      <strong>Illness / Diagnosis:</strong> {selectedApproval.illness_details}
                    </p>
                  )}
                </div>
              )}

              {/* Documentary Attachments */}
              <div className="border border-slate-200 rounded">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wide text-slate-700">
                  Supporting Documentation
                </div>
                <div className="p-3 space-y-2">
                  {CSC_DOCUMENT_SPECS.map(({ key, title, subtitle, color }) => {
                    const fileUrl = selectedApproval[key];
                    if (!fileUrl) return null;
                    return (
                      <DocumentAttachmentCard
                        key={key}
                        title={title}
                        subtitle={subtitle}
                        fileUrl={fileUrl}
                        color={color}
                      />
                    );
                  })}
                  {!CSC_DOCUMENT_SPECS.some(({ key }) => selectedApproval[key]) && (
                    <p className="text-slate-400 italic text-center py-2 text-xs">
                      No mandatory supporting documents uploaded.
                    </p>
                  )}
                </div>
              </div>

              {/* Action Endorsement */}
              {['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(selectedApproval.status) && (
                <div className="border border-slate-200 rounded p-4 bg-slate-50 space-y-3">
                  <div className="font-bold text-[11px] uppercase tracking-wide text-slate-700">
                    7.A Recommendation for Approval
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Disapproval Reason or Supervisory Remarks (if rejecting)
                    </label>
                    <textarea 
                      className="textarea textarea-bordered textarea-xs w-full bg-white border-slate-300 rounded text-xs font-medium focus:border-primary" 
                      placeholder="State reason if not recommending..."
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>

                  {selectedApproval.can_approve ? (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          onReject({ id: selectedApproval.id, reason: rejectionReason });
                          setSelectedApproval(null);
                          setRejectionReason('');
                        }}
                        disabled={isRejectPending}
                        className="btn btn-sm btn-outline border-rose-300 text-rose-700 hover:bg-rose-50 rounded text-xs font-semibold px-4"
                      >
                        {isRejectPending ? 'Processing...' : 'Disapprove'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onApprove(selectedApproval.id);
                          setSelectedApproval(null);
                        }}
                        disabled={isApprovePending}
                        className="btn btn-sm bg-[#0038a8] text-white hover:bg-[#002b80] rounded text-xs font-semibold px-5 border-none"
                      >
                        {isApprovePending ? 'Endorsing...' : (
                          selectedApproval.status === 'pending_supervisor' ? 'Recommend Approval (Supervisor)' :
                          selectedApproval.status === 'pending_hr' ? 'Verify & Certify (HR)' : 'Final Approve'
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-xs text-center italic">
                      Current stage: {formatStatus(selectedApproval.status)}. Awaiting action from authorized signatory.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end shrink-0">
              <button 
                type="button" 
                onClick={() => { setSelectedApproval(null); setRejectionReason(''); }} 
                className="btn btn-xs btn-ghost border border-slate-200 text-slate-700 hover:bg-slate-100 rounded px-4 text-xs font-medium"
              >
                Close Record
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setSelectedApproval(null)}></div>
        </div>
      )}
    </div>
  );
};

export default SupervisorApprovalQueue;
