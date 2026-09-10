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

/**
 * Payroll & Payslip Management
 * Grouped Cutoff Workflow (Preparation -> Approval -> DV -> ATM Release)
 * Clean, declarative view driven by usePayroll domain hook.
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
      alert(`Cannot generate payroll: ${employee.first_name} ${employee.last_name} has no salary set in their profile.`);
      return;
    }
    await generatePayroll({ employee_id: selectedEmployee, cutoff_period: selectedCutoff });
  };

  const handleBulkGenerate = () => {
    bulkGeneratePayroll({ cutoff_period: selectedCutoff });
  };

  const handleBulkApprove = () => {
    if (window.confirm(`Are you sure you want to approve the General Payroll Sheet for ${selectedCutoff}?`)) {
      bulkApprovePayroll({ cutoff_period: selectedCutoff });
    }
  };

  const handleBulkRelease = () => {
    if (window.confirm(`Are you sure you want to release and credit all salaries to LandBank ATM for ${selectedCutoff}? This will record any loan payments and notify staff.`)) {
      bulkReleasePayroll({ cutoff_period: selectedCutoff });
    }
  };

  const activePayrolls = cutoffPayrolls.filter((p) =>
    p.employee_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-primary">
        <Loader2 className="w-12 h-12 animate-spin opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Loading Payroll Data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-750 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Release Salaries & Payslips</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                <p className="text-[10px] font-black opacity-45 uppercase tracking-widest">Lucena School Division</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="text-[10px] bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-blue-800 flex items-center gap-2 max-w-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Only the <strong>Accountant</strong> can calculate and release salaries. Only the <strong>Superintendent</strong> can sign and approve the general payroll sheets.</span>
        </div>
      </div>

      <PayrollCutoffSelector
        selectedCutoff={selectedCutoff}
        onSelectCutoff={(period) => setSelectedCutoff(period)}
        allPayrolls={allPayrolls}
      />

      <PayrollWorkflowStepper
        selectedCutoff={selectedCutoff}
        cutoffStatus={cutoffStatus}
        totalGross={totalGross}
        totalDeductions={totalDeductions}
        totalNet={totalNet}
      />

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
