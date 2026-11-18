import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { fetchAllPages } from '../../../api/pagination';

export function usePayrollQueries() {
  // 1. Data Fetching
  const employeeQuery = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, 'all'],
    queryFn: ({ signal }) => fetchAllPages('employees/', {}, signal),
  });

  const { data: rawEmployees = [], isLoading: loadingEmployees } = employeeQuery;
  const employees = Array.isArray(rawEmployees) ? rawEmployees : rawEmployees?.results || [];

  const payrollQuery = useQuery({
    queryKey: [QUERY_KEYS.PAYROLL, 'all'],
    queryFn: ({ signal }) => fetchAllPages('payroll/', {}, signal),
  });

  const { data: rawPayrolls = [], isLoading: loadingPayrolls } = payrollQuery;
  const allPayrolls = Array.isArray(rawPayrolls) ? rawPayrolls : rawPayrolls?.results || [];


  return {
    employees, allPayrolls, loadingEmployees, loadingPayrolls,
    isError: employeeQuery.isError || payrollQuery.isError,
    error: employeeQuery.error || payrollQuery.error,
    isRefreshing: employeeQuery.isFetching || payrollQuery.isFetching,
    retry: () => Promise.all([employeeQuery.refetch(), payrollQuery.refetch()]),
  };
}
