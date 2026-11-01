import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';

export function useLoansQueries(selectedLoanId) {
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


  return { loans, checklist, documents, isLoansLoading, isChecklistLoading, isDocumentsLoading, isError, error };
}
