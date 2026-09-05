import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { useToast } from '../../../context/ToastContext';

/**
 * Custom Domain Hook for Provident Fund Loans
 */
export function useLoans(selectedLoanId = null) {
  const queryClient = useQueryClient();
  const toast = useToast();

  // 1. Fetch All Loans
  const { data: rawLoans = [], isLoading: isLoansLoading, isError, error } = useQuery({
    queryKey: [QUERY_KEYS.LOANS],
    queryFn: async () => {
      const res = await api.get('loans/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const loans = Array.isArray(rawLoans) ? rawLoans : rawLoans?.results || [];

  // 2. Fetch Selected Loan Checklist (conditional)
  const { data: checklist, isLoading: isChecklistLoading } = useQuery({
    queryKey: [QUERY_KEYS.LOANS, selectedLoanId, 'checklist'],
    queryFn: async () => {
      const res = await api.get(`loans/${selectedLoanId}/checklist/`);
      return res.data;
    },
    enabled: Boolean(selectedLoanId),
  });

  // 3. Fetch Selected Loan Documents (conditional)
  const { data: documents = [], isLoading: isDocumentsLoading } = useQuery({
    queryKey: [QUERY_KEYS.LOANS, selectedLoanId, 'documents'],
    queryFn: async () => {
      const res = await api.get(`loans/${selectedLoanId}/documents/`);
      return res.data;
    },
    enabled: Boolean(selectedLoanId),
  });

  const invalidateLoans = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LOANS] });
  };

  // 4. Mutations
  const applyMutation = useMutation({
    mutationFn: async ({ formData, files = [] }) => {
      const res = await api.post('loans/', formData);
      const loanId = res.data.id;
      for (const { doc_type, file } of files) {
        const fd = new FormData();
        fd.append('doc_type', doc_type);
        fd.append('file', file);
        await api.post(`loans/${loanId}/upload_document/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return res.data;
    },
    onSuccess: () => {
      invalidateLoans();
      toast.success('Loan application sent successfully!');
    },
    onError: (err) => {
      const errorData = err.response?.data;
      let msg = 'Application failed. Please ensure all data is correct.';
      if (errorData) {
        if (typeof errorData === 'string') msg = errorData;
        else if (Array.isArray(errorData)) msg = errorData[0];
        else if (errorData.detail) msg = errorData.detail;
      }
      toast.error(msg);
    },
  });

  const resubmitMutation = useMutation({
    mutationFn: async ({ id, formData, files = [] }) => {
      const res = await api.post(`loans/${id}/resubmit/`, formData);
      for (const { doc_type, file } of files) {
        const fd = new FormData();
        fd.append('doc_type', doc_type);
        fd.append('file', file);
        await api.post(`loans/${id}/upload_document/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return res.data;
    },
    onSuccess: () => {
      invalidateLoans();
      toast.success('Application resubmitted successfully!');
    },
    onError: (err) => {
      const errorData = err.response?.data;
      let msg = 'Resubmission failed. Please check your data and try again.';
      if (errorData) {
        if (typeof errorData === 'string') msg = errorData;
        else if (Array.isArray(errorData)) msg = errorData[0];
        else if (errorData.detail) msg = errorData.detail;
      }
      toast.error(msg);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id) => api.post(`loans/${id}/verify/`),
    onSuccess: () => {
      invalidateLoans();
      toast.success('Loan documents verified successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Verification failed.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, remarks }) => api.post(`loans/${id}/approve/`, { remarks }),
    onSuccess: () => {
      invalidateLoans();
      toast.success('Loan approved successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Approval failed.');
    },
  });

  const disburseMutation = useMutation({
    mutationFn: (id) => api.post(`loans/${id}/release-funds/`),
    onSuccess: () => {
      invalidateLoans();
      toast.success('Loan funds released successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Disbursement failed.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }) => api.post(`loans/${id}/reject/`, { remarks }),
    onSuccess: () => {
      invalidateLoans();
      toast.info('Loan rejected.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Rejection failed.');
    },
  });

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
