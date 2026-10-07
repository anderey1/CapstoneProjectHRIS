import React, { useState } from 'react';
import { 
  Wallet, ShieldCheck, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  usePayroll,
  PayrollCutoffSelector,
  PayrollWorkflowStepper,
  PayrollActionPanel,
  PayrollBreakdownTable,
} from '../../features/payroll';

const formatCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Payroll Management (Institutional Financial Control Center)
 * Official General Payroll (Form 7) and Semi-Monthly ATM Disbursement Portal.
 */
const Payroll = () => {
  const { user } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Roles permission check
  const isSuperintendent = user?.role === 'SUPERINTENDENT';
  const isAccountant = user?.role === 'ACCOUNTANT';

  // Permissions mapping
  const canGenerate = isAccountant;
  const canApprove = isSuperintendent;
  const canRelease = isAccountant;

  const {
    employees,
    allPayrolls,
    selectedCutoff,
    setSelectedCutoff,
    cutoffPayrolls,
    cutoffStatus,
    totalGross,
    totalDeductions,
    totalNet,
    isLoading,
    generatePayroll,
    isGenerating,
    bulkGeneratePayroll,
    isBulkGenerating,
    approvePayroll,
    isApproving,
    releasePayroll,
    isReleasing,
    bulkApprovePayroll,
    isBulkApproving,
    bulkReleasePayroll,
    isBulkReleasing,
    exportPayrollSheet,
    exportDisbursementVoucher,
  } = usePayroll();

  const handleGenerate = async () => {
    if (!selectedEmployee) return;
    const employee = employees?.find((emp) => emp.id === parseInt(selectedEmployee));
    if (employee && (employee.salary === null || employee.salary === undefined || parseFloat(employee.salary) <= 0)) {
      alert(`Cannot generate payroll: ${employee.first_name} ${employee.last_name} has no salary grade set in their profile.`);
      return;
    }
    await generatePayroll({ employee_id: selectedEmployee, cutoff_period: selectedCutoff });
  };

  const handleBulkGenerate = () => {
    bulkGeneratePayroll({ cutoff_period: selectedCutoff });
  };

  const handleBulkApprove = () => {
    if (window.confirm(`Certify and approve the General Payroll Sheet (Form 7) for ${selectedCutoff}?`)) {
      bulkApprovePayroll({ cutoff_period: selectedCutoff });
    }
  };

  const handleBulkRelease = () => {
    if (window.confirm(`Disburse and credit all net salaries to LandBank ATM accounts for ${selectedCutoff}? This will record statutory loan payments and lock the cycle.`)) {
      bulkReleasePayroll({ cutoff_period: selectedCutoff });
    }
  };

  const activePayrolls = cutoffPayrolls.filter((p) =>
    (p.employee_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0038A8]" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Loading Division Payroll Ledger...
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
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Payroll & Disbursement Center
                </h1>
                <span className="badge badge-sm bg-slate-100 text-slate-700 border-slate-200 font-semibold text-[10px]">
                  General Payroll (Form 7)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                DepEd Schools Division of Lucena City • Accounting & Cash Management Services
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0038A8] shrink-0" />
            <span>
              Role: <strong className="text-slate-900">{user?.role?.replace('_', ' ')}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Financial Executive Summary Cards (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Gross Compensation
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(totalGross)}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              Pre-deduction
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Mandatory Withholdings
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-rose-700 font-mono tabular-nums">
              {formatCurrency(totalDeductions)}
            </span>
            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
              Statutory & Loans
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Net Cash Payable
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-[#0038A8] font-mono tabular-nums">
              {formatCurrency(totalNet)}
            </span>
            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              LandBank ATM
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Active Payroll Staff
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {cutoffPayrolls.length} <span className="text-xs font-normal text-slate-500">Personnel</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
              Period Cycle
            </span>
          </div>
        </div>
      </div>

      {/* 1. Cutoff Selector */}
      <PayrollCutoffSelector
        selectedCutoff={selectedCutoff}
        onSelectCutoff={(period) => setSelectedCutoff(period)}
        allPayrolls={allPayrolls}
      />

      {/* 2. Pipeline Stepper */}
      <PayrollWorkflowStepper
        cutoffStatus={cutoffStatus}
      />

      {/* 3. Action Command Panel */}
      <PayrollActionPanel
        cutoffStatus={cutoffStatus}
        canGenerate={canGenerate}
        canApprove={canApprove}
        canRelease={canRelease}
        handleBulkGenerate={handleBulkGenerate}
        bulkGenerateLoading={isBulkGenerating}
        handleBulkApprove={handleBulkApprove}
        bulkApproveLoading={isBulkApproving}
        handleBulkRelease={handleBulkRelease}
        bulkReleaseLoading={isBulkReleasing}
        handleExportPayrollSheet={() => exportPayrollSheet(selectedCutoff)}
        handleExportDV={() => exportDisbursementVoucher(selectedCutoff)}
        employees={employees}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
        handleGenerate={handleGenerate}
        generateLoading={isGenerating}
      />

      {/* 4. General Payroll Sheet Table */}
      <PayrollBreakdownTable
        selectedCutoff={selectedCutoff}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activePayrolls={activePayrolls}
        canApprove={canApprove}
        canRelease={canRelease}
        onApprove={(id) => approvePayroll(id)}
        approveLoading={isApproving}
        onRelease={(id) => releasePayroll(id)}
        releaseLoading={isReleasing}
      />
    </div>
  );
};

export default Payroll;
