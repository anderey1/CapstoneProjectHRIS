import React, { useState } from 'react';
import { 
  Wallet, ShieldCheck, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import PageLoader from '../../components/common/PageLoader';
import Pagination from '../../components/common/Pagination';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { QUERY_KEYS } from '../../api/queryKeys';
import {
  usePayroll,
  PayrollCutoffSelector,
  PayrollWorkflowStepper,
  PayrollActionPanel,
  PayrollBreakdownTable,
} from '../../features/payroll';

import { formatCurrency } from '../../features/payroll/utils/payrollDisplay';

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
    isError,
    retry,
    isRefreshing,
    dataAvailable,
    processingAvailable,
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
    if (!selectedEmployee || !processingAvailable || isRefreshing) return;
    const employee = employees?.find((emp) => emp.id === parseInt(selectedEmployee));
    if (!employee) return;
    if (employee.salary === null || employee.salary === undefined || !Number.isFinite(Number(employee.salary)) || Number(employee.salary) <= 0) {
      alert(`Cannot generate payroll: ${employee.first_name} ${employee.last_name} has no valid salary recorded in their profile.`);
      return;
    }
    await generatePayroll({ employee_id: selectedEmployee, cutoff_period: selectedCutoff });
  };

  const handleBulkGenerate = () => {
    if (!processingAvailable || isRefreshing) return;
    bulkGeneratePayroll({ cutoff_period: selectedCutoff });
  };

  const handleBulkApprove = () => {
    if (!processingAvailable || isRefreshing) return;
    if (window.confirm(`Certify and approve the General Payroll Sheet (Form 7) for ${selectedCutoff}?`)) {
      bulkApprovePayroll({ cutoff_period: selectedCutoff });
    }
  };

  const handleBulkRelease = () => {
    if (!processingAvailable || isRefreshing) return;
    if (window.confirm(`Record payroll release for ${selectedCutoff}? This records loan payments and locks the cycle. It does not transfer money to bank accounts.`)) {
      bulkReleasePayroll({ cutoff_period: selectedCutoff });
    }
  };

  const { records: activePayrolls, pagination, isFetching: loadingRecords, isError: recordsError, refetch: retryRecords } = usePaginatedList(QUERY_KEYS.PAYROLL, 'payroll/', {
    cutoff_period: selectedCutoff, search: searchTerm,
  });

  if (isLoading) {
    return <PageLoader label="Loading payroll records..." />;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        icon={Wallet}
        title="Payroll management"
        badge="General Payroll (Form 7)"
        subtitle="DepEd Schools Division of Lucena City · Accounting & Cash Management Services"
      >
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span>
              Role: <strong className="text-slate-900">{user?.role?.replace('_', ' ')}</strong>
            </span>
          </div>
        </div>
      </PageHeader>

      {isError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p>Could not load authoritative payroll or employee data. Totals and processing are unavailable.</p>
          <button type="button" onClick={retry} disabled={isRefreshing} className="btn min-h-11 mt-3 bg-white text-red-800">
            {isRefreshing ? 'Retrying...' : 'Retry payroll data'}
          </button>
        </div>
      )}
      {dataAvailable && !processingAvailable && (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Payroll amounts or statuses are missing. Processing is disabled until the records are corrected.
        </p>
      )}

      {/* Financial Executive Summary Cards (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gross Compensation
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(totalGross)}
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              Pre-deduction
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Required Deductions
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-rose-700 font-mono tabular-nums">
              {formatCurrency(totalDeductions)}
            </span>
            <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
              Statutory & Loans
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Net Cash Payable
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-primary font-mono tabular-nums">
              {formatCurrency(totalNet)}
            </span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
              Recorded net pay
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Payroll Staff
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {dataAvailable ? cutoffPayrolls.length : 'Not available'} <span className="text-xs font-normal text-slate-500">Personnel</span>
            </span>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
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
        dataAvailable={dataAvailable}
      />

      {/* 2. Pipeline Stepper */}
      <PayrollWorkflowStepper
        cutoffStatus={cutoffStatus}
      />

      {/* 3. Action Command Panel */}
      <PayrollActionPanel
        cutoffStatus={cutoffStatus}
        dataUnavailable={!processingAvailable || isRefreshing || loadingRecords || recordsError}
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

      <Pagination pagination={pagination} label="payroll records" />
      {/* 4. General Payroll Sheet Table */}
      <PayrollBreakdownTable
        selectedCutoff={selectedCutoff}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activePayrolls={activePayrolls}
        dataUnavailable={!processingAvailable || isRefreshing || loadingRecords || recordsError}
        isLoading={loadingRecords}
        isError={recordsError}
        retry={retryRecords}
        canApprove={canApprove}
        canRelease={canRelease}
        onApprove={(id) => processingAvailable && !isRefreshing && approvePayroll(id)}
        approveLoading={isApproving}
        onRelease={(id) => processingAvailable && !isRefreshing && releasePayroll(id)}
        releaseLoading={isReleasing}
      />
    </div>
  );
};

export default Payroll;
