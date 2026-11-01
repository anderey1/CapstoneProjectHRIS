import { usePayrollExports } from './usePayrollExports';
import { usePayrollQueries } from './usePayrollQueries';
import { usePayrollMutations } from './usePayrollMutations';
import { useState } from 'react';
import { getCutoffStatus } from '../components/payrollConstants';

/**
 * Custom Domain Hook for Payroll Cutoffs & Salary Releases
 */
export function usePayroll(initialCutoff = 'May 1-15, 2026') {
  const [selectedCutoff, setSelectedCutoff] = useState(initialCutoff);

  const { employees, allPayrolls, loadingEmployees, loadingPayrolls } = usePayrollQueries();

  const {
    generateMutation, bulkGenerateMutation, approveMutation,
    releaseMutation, bulkApproveMutation, bulkReleaseMutation,
  } = usePayrollMutations();

  const { exportPayrollSheet, exportDisbursementVoucher } = usePayrollExports(selectedCutoff);

  // 4. Cutoff-level Calculations
  const cutoffPayrolls = allPayrolls.filter((p) => p.cutoff_period === selectedCutoff);
  const cutoffStatus = getCutoffStatus(cutoffPayrolls);

  const totalGross = cutoffPayrolls.reduce(
    (sum, p) => sum + parseFloat(p.gross_salary || p.basic_salary || 0),
    0
  );
  const totalDeductions = cutoffPayrolls.reduce(
    (sum, p) => sum + parseFloat(p.total_deductions || 0),
    0
  );
  const totalNet = cutoffPayrolls.reduce(
    (sum, p) => sum + parseFloat(p.net_salary || 0),
    0
  );

  return {
    employees,
    allPayrolls,
    selectedCutoff,
    setSelectedCutoff,
    cutoffPayrolls,
    cutoffStatus,
    totalGross,
    totalDeductions,
    totalNet,
    isLoading: loadingPayrolls || loadingEmployees,
    generatePayroll: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    bulkGeneratePayroll: bulkGenerateMutation.mutateAsync,
    isBulkGenerating: bulkGenerateMutation.isPending,
    approvePayroll: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    releasePayroll: releaseMutation.mutateAsync,
    isReleasing: releaseMutation.isPending,
    bulkApprovePayroll: bulkApproveMutation.mutateAsync,
    isBulkApproving: bulkApproveMutation.isPending,
    bulkReleasePayroll: bulkReleaseMutation.mutateAsync,
    isBulkReleasing: bulkReleaseMutation.isPending,
    exportPayrollSheet,
    exportDisbursementVoucher,
  };
}
