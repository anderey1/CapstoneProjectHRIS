import React, { useState, useMemo } from 'react';
import {
  Coins,
  PlusCircle,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLoans, ApplyLoanModal, SubsidiaryLedger } from '../../features/loans';

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

const STATUS_BADGES = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  verified: 'bg-blue-50 text-blue-800 border-blue-200',
  approved: 'bg-purple-50 text-purple-800 border-purple-200',
  released: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  paid: 'bg-slate-100 text-slate-700 border-slate-300',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200',
};

const STATUS_LABELS = {
  pending: 'Under Review',
  verified: 'HR Verified',
  approved: 'SDS Approved',
  released: 'Disbursed (Active)',
  paid: 'Settled (Paid)',
  rejected: 'Rejected / Returned',
};

/**
 * My Loans (Personal Provident Fund Loan Ledger & Amortization Portfolio)
 * Conforming to DepEd Order No. 37, s. 2018 (Provident Fund Guidelines).
 */
const MyLoans = () => {
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [inspectingLoan, setInspectingLoan] = useState(null);

  const {
    loans = [],
    isLoading,
    applyLoan,
    isApplying,
    resubmitLoan,
    isResubmitting,
  } = useLoans();

  const handleApplySubmit = async (formData, files) => {
    try {
      if (selectedLoan) {
        await resubmitLoan({ id: selectedLoan.id, formData, files });
      } else {
        await applyLoan({ formData, files });
      }
      setActiveModal(null);
      setSelectedLoan(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleResubmitClick = (loan) => {
    setSelectedLoan(loan);
    setActiveModal('apply');
  };

  // Operational Metrics
  const metrics = useMemo(() => {
    let activeDisbursed = 0;
    let monthlyAmortization = 0;
    let pendingCount = 0;
    let paidCount = 0;

    loans.forEach((l) => {
      const amount = parseFloat(l.loan_amount) || 0;
      const monthly = parseFloat(l.monthly_payment) || 0;

      if (['released', 'approved'].includes(l.status)) {
        activeDisbursed += amount;
        monthlyAmortization += monthly;
      }
      if (['pending', 'verified'].includes(l.status)) {
        pendingCount += 1;
      }
      if (l.status === 'paid') {
        paidCount += 1;
      }
    });

    return {
      activeDisbursed,
      monthlyAmortization,
      pendingCount,
      paidCount,
      totalCount: loans.length,
    };
  }, [loans]);

  if (isLoading) {
    return (
      <div className="p-8 flex flex-col justify-center h-[60vh] items-center space-y-3">
        <span className="loading loading-spinner loading-lg text-[#0038A8]"></span>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Loading Personal Provident Loan Portfolio...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* DepEd Institutional Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
            Republic of the Philippines • Department of Education • SDO Lucena City
          </span>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center text-[#0038A8]">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Personal Provident Fund Loan Portfolio
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            DepEd Order No. 37, s. 2018 Guidelines • Applications, Active Accounts &amp; Amortization Ledgers
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedLoan(null);
            setActiveModal('apply');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0038A8] text-white rounded-md text-xs font-semibold hover:bg-[#002c85] transition-colors shadow-sm self-start md:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Apply for Provident Loan
        </button>
      </div>

      {/* 4-Metric Personal Loan Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Active Disbursed Principal */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Disbursed Principal
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              ₱{metrics.activeDisbursed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Active loan capital</span>
        </div>

        {/* Monthly Payroll Deduction */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Monthly Amortization
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#0038A8]">
              ₱{metrics.monthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Payroll deduction total</span>
        </div>

        {/* Pending Review */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Applications Under Review
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              {metrics.pendingCount}
            </span>
            <span className="text-xs text-slate-500">applications</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">HR &amp; SDS endorsement</span>
        </div>

        {/* Settled / Paid */}
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Fully Settled Accounts
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {metrics.paidCount}
            </span>
            <span className="text-xs text-slate-500">accounts</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Historical paid loans</span>
        </div>
      </div>

      {/* High-Density Personal Loan Ledger Table */}
      <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#0038A8]" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Provident Fund Personal Loan Ledger
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {loans.length} Recorded Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-bold">Reference ID</th>
                <th className="py-2.5 px-3 font-bold">Filing Date</th>
                <th className="py-2.5 px-3 font-bold">Purpose</th>
                <th className="py-2.5 px-3 font-bold text-right">Principal</th>
                <th className="py-2.5 px-3 font-bold text-center">Rate &amp; Term</th>
                <th className="py-2.5 px-3 font-bold text-right">Monthly Deduction</th>
                <th className="py-2.5 px-4 font-bold">Co-Maker</th>
                <th className="py-2.5 px-3 font-bold text-center">Status</th>
                <th className="py-2.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loans.length > 0 ? (
                loans.map((loan) => {
                  const purposeClass = PURPOSE_BADGES[loan.purpose] || 'bg-slate-100 text-slate-700 border-slate-200';
                  const statusClass = STATUS_BADGES[loan.status] || 'bg-slate-100 text-slate-700 border-slate-200';
                  const statusLabel = STATUS_LABELS[loan.status] || loan.status?.toUpperCase();

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Reference ID */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900 text-xs">
                        #LOAN-{loan.id.toString().padStart(4, '0')}
                      </td>

                      {/* Filing Date */}
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-600 text-xs">
                        {loan.date_applied
                          ? new Date(loan.date_applied).toLocaleDateString()
                          : '—'}
                      </td>

                      {/* Purpose */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${purposeClass}`}
                        >
                          {PURPOSE_LABELS[loan.purpose] || loan.purpose}
                        </span>
                      </td>

                      {/* Principal Amount */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                        ₱{parseFloat(loan.loan_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Rate & Term */}
                      <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-700 text-xs">
                        {loan.interest_rate}% • {loan.term_months} Mos
                      </td>

                      {/* Monthly Amortization */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-[#0038A8]">
                        ₱{parseFloat(loan.monthly_payment || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Co-Maker */}
                      <td className="py-3 px-4 text-slate-700 text-xs">
                        {loan.co_maker_name_display || loan.co_maker_name || (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingLoan(loan)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ledger
                          </button>
                          {loan.status === 'rejected' && (
                            <button
                              onClick={() => handleResubmitClick(loan)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 rounded hover:bg-rose-100 transition-colors"
                            >
                              Resubmit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-xs text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No Provident Fund loan applications or active credit accounts recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 border-t border-slate-300 px-4 py-2 text-[11px] text-slate-500 flex justify-between">
          <span>DepEd SDO Lucena City • Provident Fund Operational System</span>
          <span className="font-mono">DO 37, s. 2018 Standards</span>
        </div>
      </div>

      {/* Official Subsidiary Ledger Inspection Modal */}
      {inspectingLoan && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-4xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  Department of Education • SDO Lucena City
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  Provident Fund Subsidiary Ledger Docket
                </h2>
                <span className="text-xs font-mono tabular-nums text-[#0038A8] block mt-0.5">
                  #LOAN-{inspectingLoan.id.toString().padStart(4, '0')} • {inspectingLoan.employee_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLoan(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Metadata Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Principal Amount
                  </span>
                  <strong className="text-slate-900 text-sm font-mono block mt-0.5">
                    ₱{parseFloat(inspectingLoan.loan_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Monthly Deduction
                  </span>
                  <strong className="text-[#0038A8] text-sm font-mono block mt-0.5">
                    ₱{parseFloat(inspectingLoan.monthly_payment || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Interest &amp; Term
                  </span>
                  <span className="text-slate-800 text-xs font-mono block mt-0.5">
                    {inspectingLoan.interest_rate}% p.a. • {inspectingLoan.term_months} Months
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">
                    Approval Standing
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border mt-0.5 ${
                      STATUS_BADGES[inspectingLoan.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {STATUS_LABELS[inspectingLoan.status] || inspectingLoan.status}
                  </span>
                </div>
              </div>

              {/* Review Remarks if any */}
              {inspectingLoan.remarks && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded text-xs space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                    Review / Endorsement Remarks
                  </span>
                  <p className="text-slate-800 italic">{inspectingLoan.remarks}</p>
                </div>
              )}

              {/* Digitized Subsidiary Ledger Card */}
              <div className="border border-slate-200 rounded-md p-4 bg-white space-y-2">
                <SubsidiaryLedger loan={inspectingLoan} userCanPost={false} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setInspectingLoan(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
              >
                Close Docket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Loan Modal */}
      <ApplyLoanModal
        isOpen={activeModal === 'apply'}
        onClose={() => {
          setActiveModal(null);
          setSelectedLoan(null);
        }}
        onSubmit={handleApplySubmit}
        isPending={isApplying || isResubmitting}
        user={user}
        initialData={selectedLoan}
      />
    </div>
  );
};

export default MyLoans;
