import React from 'react';

/**
 * Multi-step approval/verification/disbursement workflow actions for Loan Review Modal.
 */
const LoanActionWorkflow = ({
  loan,
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
  onComplete,
}) => {
  if (!loan) return null;

  return (
    <>
      {/* Step 1: Document Verification */}
      {loan.status === 'pending' && (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            Step 1: Verify Documents
          </h4>

          {canVerify || canApprove ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {canVerify && (
                  <button
                    type="button"
                    onClick={async () => {
                      await verifyLoan(loan.id);
                      onComplete();
                    }}
                    disabled={isVerifying}
                    className="btn btn-sm bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-md text-xs font-semibold px-4 h-9 shadow-xs"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Requirements & Forward to Superintendent'}
                  </button>
                )}

                {canApprove && (
                  <button
                    type="button"
                    onClick={async () => {
                      await approveLoan({ id: loan.id, remarks: approveRemarks });
                      setApproveRemarks('');
                      onComplete();
                    }}
                    disabled={isApproving}
                    className="btn btn-sm bg-emerald-700 hover:bg-emerald-800 text-white border-none rounded-md text-xs font-semibold px-4 h-9 shadow-xs"
                  >
                    {isApproving ? 'Approving...' : 'Directly Approve (Superintendent Override)'}
                  </button>
                )}
              </div>

              {/* Reject Drawer */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Reason for Disapproval
                </label>
                <textarea
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Reason for returning files or disapproving loan..."
                  rows={2}
                  className="textarea textarea-sm w-full bg-white border-slate-200 text-xs rounded-md"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await rejectLoan({ id: loan.id, remarks: rejectRemarks });
                    setRejectRemarks('');
                    onComplete();
                  }}
                  disabled={isRejecting || !rejectRemarks.trim()}
                  className="btn btn-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold px-3 h-8"
                >
                  {isRejecting ? 'Rejecting...' : 'Disapprove Application'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Document verification is restricted to Division Accounting.
            </p>
          )}
        </div>
      )}

      {/* Step 2: Superintendent Certification */}
      {loan.status === 'verified' && (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            Step 2: Superintendent Approval
          </h4>

          {canApprove ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <input
                  type="text"
                  value={approveRemarks}
                  onChange={(e) => setApproveRemarks(e.target.value)}
                  placeholder="Endorsement remarks (optional)..."
                  className="input input-sm input-bordered w-full text-xs bg-white border-slate-200 rounded-md"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await approveLoan({ id: loan.id, remarks: approveRemarks });
                    setApproveRemarks('');
                    onComplete();
                  }}
                  disabled={isApproving}
                  className="btn btn-sm bg-emerald-700 hover:bg-emerald-800 text-white border-none rounded-md text-xs font-semibold px-4 h-9 shadow-xs"
                >
                  {isApproving ? 'Approving...' : 'Certify & Approve Provident Fund Loan'}
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                <textarea
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="Reason for disapproval..."
                  rows={2}
                  className="textarea textarea-sm w-full bg-white border-slate-200 text-xs rounded-md"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await rejectLoan({ id: loan.id, remarks: rejectRemarks });
                    setRejectRemarks('');
                    onComplete();
                  }}
                  disabled={isRejecting || !rejectRemarks.trim()}
                  className="btn btn-sm bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-xs font-semibold px-3 h-8"
                >
                  {isRejecting ? 'Rejecting...' : 'Disapprove Application'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Awaiting executive sign-off from the Schools Division Superintendent.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Cashier / Payout Release */}
      {loan.status === 'approved' && (
        <div className="space-y-3 pt-3 border-t border-slate-200">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            Disbursement & Release (Step 3: ATM / Check Payout)
          </h4>

          {canDisburse ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md space-y-2">
              <p className="text-xs text-blue-900 font-medium">
                Superintendent approval is complete. Confirm fund availability before issuing the disbursement check or ATM credit.
              </p>
              <button
                type="button"
                onClick={async () => {
                  await disburseLoan(loan.id);
                  onComplete();
                }}
                disabled={isDisbursing}
                className="btn btn-sm bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-md text-xs font-semibold px-4 h-9 shadow-xs"
              >
                {isDisbursing ? 'Releasing Funds...' : 'Record Loan Release'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Awaiting cashier or accountant disbursement.
            </p>
          )}
        </div>
      )}
    </>
  );
};

export default LoanActionWorkflow;
