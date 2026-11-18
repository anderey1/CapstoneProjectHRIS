import { usePayrollExports } from './usePayrollExports';
import { usePayrollQueries } from './usePayrollQueries';
import { usePayrollMutations } from './usePayrollMutations';
import { useState } from 'react';
import { currentCutoff, getCutoffStatus } from '../components/payrollConstants';
import { sumRecordedAmounts } from '../utils/payrollDisplay';

/**
 * Custom Domain Hook for Payroll Cutoffs & Salary Releases
 */
export function usePayroll(initialCutoff) {
  const [selectedCutoff, setSelectedCutoff] = useState(() => initialCutoff ?? currentCutoff());

  const { employees, allPayrolls, loadingEmployees, loadingPayrolls, isError, error, isRefreshing, retry } = usePayrollQueries();

  const {
    generateMutation, bulkGenerateMutation, approveMutation,
    releaseMutation, bulkApproveMutation, bulkReleaseMutation,
  } = usePayrollMutations();

  const { exportPayrollSheet, exportDisbursementVoucher } = usePayrollExports(selectedCutoff);

  // 4. Cutoff-level Calculations
  const cutoffPayrolls = allPayrolls.filter((p) => p.cutoff_period === selectedCutoff);
  const dataAvailable = !isError && !loadingPayrolls && !loadingEmployees;
  const cutoffStatus = dataAvailable ? getCutoffStatus(cutoffPayrolls) : 'unavailable';

  const totalGross = dataAvailable ? sumRecordedAmounts(cutoffPayrolls, 'gross_salary') : null;
  const totalDeductions = dataAvailable ? sumRecordedAmounts(cutoffPayrolls, 'total_deductions') : null;
  const totalNet = dataAvailable ? sumRecordedAmounts(cutoffPayrolls, 'net_salary') : null;
  const processingAvailable = dataAvailable && cutoffStatus !== 'unavailable'
    && totalGross !== null && totalDeductions !== null && totalNet !== null;

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
    isError,
    error,
    isRefreshing,
    retry,
    dataAvailable,
    processingAvailable,
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
