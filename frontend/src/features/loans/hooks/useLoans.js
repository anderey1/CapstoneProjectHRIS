import { useLoansQueries } from './useLoansQueries';
import { useLoansMutations } from './useLoansMutations';

/**
 * Custom Domain Hook for Provident Fund Loans
 */
export function useLoans(selectedLoanId = null) {
  const {
    loans, checklist, documents, isLoansLoading,
    isChecklistLoading, isDocumentsLoading, isError, error,
  } = useLoansQueries(selectedLoanId);

  const {
    applyMutation, resubmitMutation, verifyMutation,
    approveMutation, disburseMutation, rejectMutation,
  } = useLoansMutations();

  // Grouped status lists
  const pendingLoans = loans.filter((l) => l.status === 'pending');
  const verifiedLoans = loans.filter((l) => l.status === 'verified');
  const approvedLoans = loans.filter((l) => l.status === 'approved');
  const releasedLoans = loans.filter((l) => l.status === 'released');
  const rejectedLoans = loans.filter((l) => l.status === 'rejected');
  const paidLoans = loans.filter((l) => l.status === 'paid');

  const totalReleasedValue = [...releasedLoans, ...paidLoans].reduce(
    (acc, l) => acc + parseFloat(l.loan_amount || 0),
    0
  );

  return {
    loans,
    checklist,
    documents,
    isLoading: isLoansLoading,
    isChecklistLoading,
    isDocumentsLoading,
    isError,
    error,
    pendingLoans,
    verifiedLoans,
    approvedLoans,
    releasedLoans,
    rejectedLoans,
    paidLoans,
    totalReleasedValue,
    applyLoan: applyMutation.mutateAsync,
    isApplying: applyMutation.isPending,
    resubmitLoan: resubmitMutation.mutateAsync,
    isResubmitting: resubmitMutation.isPending,
    verifyLoan: verifyMutation.mutateAsync,
    isVerifying: verifyMutation.isPending,
    approveLoan: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    disburseLoan: disburseMutation.mutateAsync,
    isDisbursing: disburseMutation.isPending,
    rejectLoan: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
  };
}
