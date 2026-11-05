import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import { fetchAllPages } from '../../../api/pagination';

export function useLoansQueries(selectedLoanId, params = {}) {
  // 1. Fetch All Loans
  const { records: loans, summary, pagination, isLoading: isLoansLoading, isError, error } =
    usePaginatedList(QUERY_KEYS.LOANS, 'loans/', params);

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
    queryFn: ({ signal }) => fetchAllPages(`loans/${selectedLoanId}/documents/`, {}, signal),
    enabled: Boolean(selectedLoanId),
  });


  return { loans, summary, pagination, checklist, documents, isLoansLoading, isChecklistLoading, isDocumentsLoading, isError, error };
}
