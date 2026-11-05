import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { fetchAllPages } from '../../../api/pagination';

export function usePayrollQueries() {
  // 1. Data Fetching
  const { data: rawEmployees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, 'all'],
    queryFn: ({ signal }) => fetchAllPages('employees/', {}, signal),
  });

  const employees = Array.isArray(rawEmployees) ? rawEmployees : rawEmployees?.results || [];

  const { data: rawPayrolls = [], isLoading: loadingPayrolls } = useQuery({
    queryKey: [QUERY_KEYS.PAYROLL, 'all'],
    queryFn: ({ signal }) => fetchAllPages('payroll/', {}, signal),
  });

  const allPayrolls = Array.isArray(rawPayrolls) ? rawPayrolls : rawPayrolls?.results || [];


  return { employees, allPayrolls, loadingEmployees, loadingPayrolls };
}
