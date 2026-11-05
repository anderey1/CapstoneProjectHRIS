import React from 'react';
import { Eye, FileCheck, Circle, MessageSquare, X } from 'lucide-react';
import SubsidiaryLedger from './SubsidiaryLedger';
import LoanActionWorkflow from './LoanActionWorkflow';
import { PURPOSE_LABELS } from './LoanRegistryTable';

const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const host = baseUrl.split('/api')[0];
  return `${host}${path}`;
};

const formatCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Institutional Loan Review & Audit Modal.
 * Encapsulates SubsidiaryLedger, borrower parameters, compliance checklist, and action workflows.
 */
const LoanReviewModal = ({
  loan,
  onClose,
  user,
  checklist,
  documents = [],
  canVerify,
  canApprove,
  canDisburse,
  verifyLoan,
  isVerifying,
  approveLoan,
  isApproving,
  disburseLoan,
  isDisbursing,
  rejectLoan,
  isRejecting,
  approveRemarks,
  setApproveRemarks,
  rejectRemarks,
  setRejectRemarks,
}) => {
  if (!loan) return null;

  const isServicingOrPaid = loan.status === 'released' || loan.status === 'paid';

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-lg max-w-3xl p-0 overflow-hidden shadow-xl border border-slate-300 bg-white max-h-[92vh] flex flex-col">
        {/* Clean Institutional Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Provident Fund Loan Review
              </span>
              <span className="font-mono text-xs text-slate-500 font-bold">
                [Ref #PF-{loan.id.toString().padStart(4, '0')}]
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Borrower: <strong className="text-slate-800">{loan.employee_name}</strong> • Applied:{' '}
              {new Date(loan.date_applied).toLocaleDateString()}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-circle text-slate-500 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {isServicingOrPaid ? (
            <SubsidiaryLedger
              loan={loan}
              userCanPost={user?.role === 'ACCOUNTANT' || user?.is_superuser}
            />
          ) : (
            <>
              {/* Financial Parameters Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Principal Amount
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {formatCurrency(loan.loan_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Monthly Amortization
                  </span>
                  <span className="text-base font-bold text-[#0038A8] font-mono">
                    {formatCurrency(loan.monthly_payment)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Repayment
                  </span>
                  <span className="text-base font-bold text-slate-900 font-mono">
                    {formatCurrency(loan.total_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Term & Rate
                  </span>
                  <span className="text-base font-bold text-slate-800 font-mono">
                    {loan.term_months} mos @ {loan.interest_rate}%
                  </span>
                </div>
              </div>

              {/* Application Particulars */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Borrower Application Particulars
                </h4>
                <div className="bg-white p-3 rounded-md border border-slate-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Designated Co-Maker:</span>
                      <span className="font-semibold text-slate-800">
                        {loan.co_maker_name_display || loan.co_maker_name || 'None Declared'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Loan Classification / Purpose:</span>
                      <span className="font-semibold text-slate-800">
                        {PURPOSE_LABELS[loan.purpose] || loan.purpose}
                      </span>
                    </div>
                  </div>

                  {loan.letter_request && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-500 block mb-0.5">
                        Letter of Intent / Request Note:
                      </span>
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                        "{loan.letter_request}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Compliance Checklist */}
              {checklist && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Supporting Documents
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        checklist.all_required_submitted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {checklist.all_required_submitted
                        ? 'All Required Documents Attached'
                        : 'Incomplete Requirements'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {checklist.checklist?.map((doc) => {
                      const uploadedDoc = documents.find((d) => d.doc_type === doc.doc_type);
                      return (
                        <div
                          key={doc.doc_type}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-200"
                        >
                          <div className="flex items-center gap-2">
                            {doc.submitted ? (
                              <FileCheck className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-300" />
                            )}
                            <span className="text-xs font-medium text-slate-800">{doc.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {uploadedDoc?.file && (
                              <a
                                href={getFileUrl(uploadedDoc.file)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-xs bg-white hover:bg-slate-100 text-[#0038A8] border border-slate-200 font-semibold"
                              >
                                <Eye className="w-3 h-3 mr-1" /> View
                              </a>
                            )}
                            {!doc.required && (
                              <span className="text-[9px] text-slate-400 font-semibold">Optional</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Existing Remarks (for resolved loans) */}
              {loan.remarks && loan.status !== 'pending' && (
                <div className="p-3 bg-amber-50/70 rounded-md border border-amber-200 flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Executive Audit Remarks
                    </span>
                    <p className="text-xs text-amber-900 mt-0.5">{loan.remarks}</p>
                    {loan.reviewed_by_name && (
                      <span className="text-[10px] text-amber-700 font-medium block mt-1">
                        Audited by: {loan.reviewed_by_name}{' '}
                        ({loan.reviewed_at ? new Date(loan.reviewed_at).toLocaleDateString() : ''})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Operational Audit Actions */}
              <LoanActionWorkflow
                loan={loan}
                canVerify={canVerify}
                canApprove={canApprove}
                canDisburse={canDisburse}
                verifyLoan={verifyLoan}
                isVerifying={isVerifying}
                approveLoan={approveLoan}
                isApproving={isApproving}
                disburseLoan={disburseLoan}
                isDisbursing={isDisbursing}
                rejectLoan={rejectLoan}
                isRejecting={isRejecting}
                approveRemarks={approveRemarks}
                setApproveRemarks={setApproveRemarks}
                rejectRemarks={rejectRemarks}
                setRejectRemarks={setRejectRemarks}
                onComplete={onClose}
              />
            </>
          )}
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default LoanReviewModal;
