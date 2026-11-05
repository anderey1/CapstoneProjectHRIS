import React from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react';
import DocumentAttachmentCard, { CSC_DOCUMENT_SPECS } from './DocumentAttachmentCard';
import { formatStatus } from './LeaveDocketTable';

/**
 * Official CSC Form No. 6 Review & Approval Modal.
 */
const LeaveReviewModal = ({
  leave,
  onClose,
  canManage,
  rejectionReason,
  setRejectionReason,
  approveLeave,
  isApproving,
  rejectLeave,
  isRejecting,
}) => {
  if (!leave) return null;

  const isPendingStatus = ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(
    leave.status
  );

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-lg max-w-4xl p-0 overflow-hidden shadow-xl border border-slate-300 bg-white h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#0038a8] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                CSC Form No. 6
              </span>
              <span className="text-xs font-mono text-slate-500">Application #{leave.id}</span>
            </div>
            <h3 className="font-bold text-base text-slate-900 mt-0.5">
              Application for Leave — {leave.employee_name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-circle text-slate-500 hover:text-slate-800"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white text-slate-800 text-xs">
          {/* Section 6: Details of Application */}
          <div className="border border-slate-200 rounded">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wide text-slate-700">
              6. Details of Application
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/40">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  6.A Type of Leave
                </span>
                <span className="font-bold text-slate-900 capitalize text-sm">
                  {leave.leave_type.replace('_', ' ')}
                </span>
                {leave.other_type_details && (
                  <span className="text-xs text-slate-600 block mt-0.5 italic">
                    ({leave.other_type_details})
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  6.C Inclusive Dates
                </span>
                <span className="font-mono tabular-nums font-semibold text-slate-900 text-xs">
                  {new Date(leave.start_date).toLocaleDateString()} —{' '}
                  {new Date(leave.end_date).toLocaleDateString()}
                </span>
                <span className="text-slate-500 block font-mono text-[11px] mt-0.5">
                  <strong>{leave.working_days_applied}</strong> working day(s) applied
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                  6.D Commutation
                </span>
                <span className="font-semibold text-slate-800 capitalize">
                  {leave.commutation?.replace('_', ' ') || 'Not Requested'}
                </span>
              </div>
            </div>

            {/* 6.B Details specification */}
            {(leave.location_details || leave.illness_details || leave.study_type) && (
              <div className="px-4 py-3 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {leave.location_details && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Where leave will be spent
                    </span>
                    <span className="font-medium text-slate-800">
                      {leave.is_within_philippines ? 'Within Philippines' : 'Abroad'}:{' '}
                      {leave.location_details}
                    </span>
                  </div>
                )}
                {leave.illness_details && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Illness / Hospitalization
                    </span>
                    <span className="font-medium text-slate-800">
                      {leave.is_in_hospital ? 'In-Hospital' : 'Out-Patient'}: {leave.illness_details}
                    </span>
                  </div>
                )}
                {leave.study_type && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Study Leave Purpose
                    </span>
                    <span className="font-medium text-slate-800 uppercase">
                      {leave.study_type.replace('_', ' ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 7.B: Certification of Leave Credits */}
          <div className="border border-slate-200 rounded">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wide text-slate-700 flex justify-between items-center">
              <span>7.B Certification of Leave Credits</span>
              <span className="text-[10px] font-normal lowercase text-slate-500">
                certified by personnel officer
              </span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50/50">
              <div className="bg-white border border-slate-200 p-3 rounded">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Vacation Leave Balance
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {leave.vacation_balance ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">days available</span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Sick Leave Balance
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {leave.sick_balance ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">days available</span>
                </div>
              </div>
            </div>
          </div>

          {/* Documentary Attachments */}
          <div className="border border-slate-200 rounded">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wide text-slate-700">
              Documentary Attachments
            </div>
            <div className="p-3 space-y-2">
              {CSC_DOCUMENT_SPECS.map(({ key, title, subtitle, color }) => {
                const fileUrl = leave[key];
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
              {!CSC_DOCUMENT_SPECS.some(({ key }) => leave[key]) && (
                <p className="text-slate-400 italic text-center py-2 text-xs">
                  No mandatory supporting documents attached to this application.
                </p>
              )}
            </div>
          </div>

          {/* Current Action / Processing Pipeline */}
          {isPendingStatus ? (
            <div className="border border-slate-200 rounded p-4 bg-slate-50 space-y-3">
              <div className="font-bold text-[11px] uppercase tracking-wide text-slate-700">
                7. Action on Application
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Disapproval / Recommendation Reason (Required if disapproving)
                </label>
                <textarea
                  className="textarea textarea-bordered textarea-xs w-full bg-white border-slate-300 rounded text-xs font-medium focus:border-primary"
                  placeholder="State precise reason for disapproval or special instructions..."
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              {leave.can_approve ? (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await rejectLeave({ id: leave.id, reason: rejectionReason });
                        onClose();
                      } catch {
                        // Handled by hook
                      }
                    }}
                    disabled={isRejecting}
                    className="btn btn-sm btn-outline border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 rounded text-xs font-semibold px-4"
                  >
                    {isRejecting ? 'Processing...' : 'Disapprove'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await approveLeave(leave.id);
                        onClose();
                      } catch {
                        // Handled by hook
                      }
                    }}
                    disabled={isApproving}
                    className="btn btn-sm bg-[#0038a8] text-white hover:bg-[#002b80] rounded text-xs font-semibold px-5 border-none"
                  >
                    {isApproving
                      ? 'Recording...'
                      : leave.status === 'pending_supervisor'
                      ? 'Recommend Approval (Supervisor)'
                      : leave.status === 'pending_hr'
                      ? 'Verify & Certify (HR)'
                      : 'Approve for Civil Service'}
                  </button>
                </div>
              ) : canManage ? (
                <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded text-xs font-medium text-center">
                  Application is pending review at stage: <strong>{formatStatus(leave.status)}</strong>.
                </div>
              ) : (
                <div className="p-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-xs font-medium text-center italic">
                  Application details are read-only for your role. Current stage: {formatStatus(leave.status)}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-slate-200 rounded p-4 bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                {leave.status === 'approved' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <span className="font-bold text-sm text-slate-900">
                  Application Status: {formatStatus(leave.status)}
                </span>
              </div>
              {leave.disapproval_reason && (
                <div className="mt-2 text-xs bg-white border border-slate-200 p-2.5 rounded">
                  <span className="font-semibold text-slate-500 block uppercase text-[10px]">
                    Official Reason:
                  </span>
                  <p className="text-slate-700 italic mt-0.5">"{leave.disapproval_reason}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-xs btn-ghost border border-slate-200 text-slate-700 hover:bg-slate-100 rounded px-4 text-xs font-medium"
          >
            Close Record
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default LeaveReviewModal;
