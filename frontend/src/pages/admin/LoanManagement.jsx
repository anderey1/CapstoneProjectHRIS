import React, { useState } from 'react';
import {
  Coins, Eye, MessageSquare,
  Circle, FileCheck, Search, 
  FileSpreadsheet, ShieldCheck, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC, PERMISSIONS } from '../../hooks/useRBAC';
import { useLoans, SubsidiaryLedger } from '../../features/loans';

const PURPOSE_LABELS = {
  general: 'General Purpose',
  medical: 'Medical Emergency',
  calamity: 'Calamity Relief',
  educational: 'Educational Aid',
  emergency: 'Emergency Need',
};

const PURPOSE_BADGES = {
  general: 'bg-slate-100 text-slate-700 border-slate-200',
  medical: 'bg-rose-50 text-rose-800 border-rose-200',
  calamity: 'bg-amber-50 text-amber-800 border-amber-200',
  educational: 'bg-blue-50 text-blue-800 border-blue-200',
  emergency: 'bg-rose-50 text-rose-800 border-rose-200',
};

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
 * Loan Management (Institutional Credit & Amortization Control Center)
 * Aligned with DepEd Order No. 37, s. 2018 (Provident Fund Revised Guidelines).
 */
const LoanManagement = () => {
  const { user } = useAuth();
  const { can } = useRBAC();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [approveRemarks, setApproveRemarks] = useState('');

  const canVerify = can(PERMISSIONS.VERIFY_LOANS);
  const canApprove = can(PERMISSIONS.APPROVE_LOANS);
  const canDisburse = can(PERMISSIONS.DISBURSE_LOANS);

  const {
    checklist,
    documents,
    isLoading,
    pendingLoans,
    verifiedLoans,
    approvedLoans,
    releasedLoans,
    rejectedLoans,
    paidLoans,
    totalReleasedValue,
    verifyLoan,
    isVerifying,
    approveLoan,
    isApproving,
    disburseLoan,
    isDisbursing,
    rejectLoan,
    isRejecting,
  } = useLoans(selectedLoan?.id);

  const allLoans = [
    ...pendingLoans,
    ...verifiedLoans,
    ...approvedLoans,
    ...releasedLoans,
    ...paidLoans,
    ...rejectedLoans
  ];

  const getFilteredLoans = () => {
    let list;
    if (activeTab === 'all') list = allLoans;
    else if (activeTab === 'pending') list = pendingLoans;
    else if (activeTab === 'verified') list = verifiedLoans;
    else if (activeTab === 'approved') list = approvedLoans;
    else if (activeTab === 'released') list = [...releasedLoans, ...paidLoans];
    else if (activeTab === 'rejected') list = rejectedLoans;
    else list = allLoans;

    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(l => 
      (l.employee_name || '').toLowerCase().includes(term) ||
      (l.department || '').toLowerCase().includes(term) ||
      String(l.id).includes(term)
    );
  };

  const filteredLoans = getFilteredLoans();

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <span className="loading loading-spinner loading-lg text-[#0038A8]"></span>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Loading Provident Fund Ledger...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Official Government Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-[#0038A8] shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Provident Fund Credit Administration
                </h1>
                <span className="badge badge-sm bg-slate-100 text-slate-700 border-slate-200 font-semibold text-[10px]">
                  DepEd Order No. 37, s. 2018
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Department of Education Division of Lucena City • Employee Loan Review, Approval & Amortization
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0038A8] shrink-0" />
            <span>
              Auditing Role: <strong className="text-slate-900">{user?.role?.replace('_', ' ')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Portfolio Operational Metrics Strip (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Awaiting Verification
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {pendingLoans.length}
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Accountant Audit
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Superintendent Endorsement
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {verifiedLoans.length}
            </span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Executive Review
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Ready for Disbursement
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {approvedLoans.length}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Cashier / ATM
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Portfolio Disbursed
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#0038A8] font-mono tabular-nums">
              {formatCurrency(totalReleasedValue)}
            </span>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Servicing
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Stage Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-2 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: 'All Applications', count: allLoans.length },
            { key: 'pending', label: '1. To Verify', count: pendingLoans.length },
            { key: 'verified', label: '2. To Approve', count: verifiedLoans.length },
            { key: 'approved', label: '3. Wait Release', count: approvedLoans.length },
            { key: 'released', label: '4. Active / Servicing', count: releasedLoans.length + paidLoans.length },
            { key: 'rejected', label: 'Disapproved', count: rejectedLoans.length },
          ].map(tab => {
            const isSelected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0038A8] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search borrower or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full pl-8.5 bg-slate-50 border-slate-200 text-xs rounded-md"
          />
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Provident Fund Credit Ledger ({filteredLoans.length} Records)
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Semi-monthly amortizations automatically deducted via General Payroll
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3">Loan Ref</th>
                <th className="px-4 py-3">Borrower & Station</th>
                <th className="px-3 py-3 text-right">Principal</th>
                <th className="px-3 py-3 text-center">Term / Rate</th>
                <th className="px-3 py-3 text-right">Amortization</th>
                <th className="px-3 py-3">Loan Purpose</th>
                <th className="px-3 py-3 text-center">Audit Stage</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => {
                  const principalVal = parseFloat(loan.loan_amount) || 0;
                  const monthlyVal = parseFloat(loan.monthly_payment) || 0;

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        PF-{loan.id.toString().padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {loan.employee_name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {loan.department || 'Division Office'}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(principalVal)}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-slate-600">
                        {loan.term_months} mos @ {loan.interest_rate}%
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-[#0038A8]">
                        {formatCurrency(monthlyVal)}/mo
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${PURPOSE_BADGES[loan.purpose] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {PURPOSE_LABELS[loan.purpose] || loan.purpose}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${
                          loan.status === 'released' || loan.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : loan.status === 'approved'
                            ? 'bg-blue-50 text-[#0038A8] border-blue-200'
                            : loan.status === 'verified'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : loan.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {loan.status === 'verified' ? 'Awaiting Superintendent' : loan.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLoan(loan);
                            setRejectRemarks('');
                            setApproveRemarks('');
                          }}
                          className="btn btn-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold px-3 h-8 shadow-xs"
                        >
                          {(loan.status === 'released' || loan.status === 'paid') ? (
                            <>
                              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-[#0038A8]" />
                              Ledger
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                              Review
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-400 italic">
                    No loan applications found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== REVIEW & AUDIT MODAL (INSTITUTIONAL REDESIGN) ===== */}
      {selectedLoan && (
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
                    [Ref #PF-{selectedLoan.id.toString().padStart(4, '0')}]
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Borrower: <strong className="text-slate-800">{selectedLoan.employee_name}</strong> • Applied: {new Date(selectedLoan.date_applied).toLocaleDateString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
                className="btn btn-ghost btn-xs btn-circle text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {(selectedLoan.status === 'released' || selectedLoan.status === 'paid') ? (
                <SubsidiaryLedger
                  loan={selectedLoan}
                  userCanPost={user?.role === 'ACCOUNTANT' || user?.is_superuser}
                />
              ) : (
                <>
                  {/* Financial Parameters Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Principal Amount</span>
                      <span className="text-base font-bold text-slate-900 font-mono">{formatCurrency(selectedLoan.loan_amount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Monthly Amortization</span>
                      <span className="text-base font-bold text-[#0038A8] font-mono">{formatCurrency(selectedLoan.monthly_payment)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Total Repayment</span>
                      <span className="text-base font-bold text-slate-900 font-mono">{formatCurrency(selectedLoan.total_amount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Term & Rate</span>
                      <span className="text-base font-bold text-slate-800 font-mono">{selectedLoan.term_months} mos @ {selectedLoan.interest_rate}%</span>
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
                          <span className="font-semibold text-slate-800">{selectedLoan.co_maker_name_display || selectedLoan.co_maker_name || 'None Declared'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Loan Classification / Purpose:</span>
                          <span className="font-semibold text-slate-800">{PURPOSE_LABELS[selectedLoan.purpose] || selectedLoan.purpose}</span>
                        </div>
                      </div>

                      {selectedLoan.letter_request && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-500 block mb-0.5">Letter of Intent / Request Note:</span>
                          <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded border border-slate-100">
                            "{selectedLoan.letter_request}"
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
                          Supporting Document Compliance
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          checklist.all_required_submitted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {checklist.all_required_submitted ? 'All Required Documents Attached' : 'Incomplete Requirements'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {checklist.checklist?.map((doc) => {
                          const uploadedDoc = documents.find(d => d.doc_type === doc.doc_type);
                          return (
                            <div key={doc.doc_type} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-200">
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
                  {selectedLoan.remarks && selectedLoan.status !== 'pending' && (
                    <div className="p-3 bg-amber-50/70 rounded-md border border-amber-200 flex items-start gap-2.5">
                      <MessageSquare className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Executive Audit Remarks</span>
                        <p className="text-xs text-amber-900 mt-0.5">{selectedLoan.remarks}</p>
                        {selectedLoan.reviewed_by_name && (
                          <span className="text-[10px] text-amber-700 font-medium block mt-1">
                            Audited by: {selectedLoan.reviewed_by_name} ({selectedLoan.reviewed_at ? new Date(selectedLoan.reviewed_at).toLocaleDateString() : ''})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Operational Audit Actions */}
                  {selectedLoan.status === 'pending' && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        Audit Actions (Step 1: Document Verification)
                      </h4>

                      {(canVerify || canApprove) ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            {canVerify && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await verifyLoan(selectedLoan.id);
                                  setSelectedLoan(null);
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
                                  await approveLoan({ id: selectedLoan.id, remarks: approveRemarks });
                                  setSelectedLoan(null);
                                  setApproveRemarks('');
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
                              Disapprove / Return Application (Specify COA audit justification):
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
                                await rejectLoan({ id: selectedLoan.id, remarks: rejectRemarks });
                                setSelectedLoan(null);
                                setRejectRemarks('');
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

                  {selectedLoan.status === 'verified' && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        Executive Approval (Step 2: Superintendent Certification)
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
                                await approveLoan({ id: selectedLoan.id, remarks: approveRemarks });
                                setSelectedLoan(null);
                                setApproveRemarks('');
                              }}
                              disabled={isApproving}
                              className="btn btn-sm bg-emerald-700 hover:bg-emerald-800 text-white border-none rounded-md text-xs font-semibold px-4 h-9 shadow-xs"
                            >
                              {isApproving ? 'Endorsing...' : 'Certify & Approve Provident Fund Loan'}
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
                                await rejectLoan({ id: selectedLoan.id, remarks: rejectRemarks });
                                setSelectedLoan(null);
                                setRejectRemarks('');
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

                  {selectedLoan.status === 'approved' && (
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
                              await disburseLoan(selectedLoan.id);
                              setSelectedLoan(null);
                            }}
                            disabled={isDisbursing}
                            className="btn btn-sm bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-md text-xs font-semibold px-4 h-9 shadow-xs"
                          >
                            {isDisbursing ? 'Releasing Funds...' : 'Release & Disburse Principal to Borrower'}
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
              )}
            </div>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setSelectedLoan(null)}></div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
