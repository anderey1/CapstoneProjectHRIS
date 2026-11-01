import { useQuery } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';

export function usePayrollQueries() {
  // 1. Data Fetching
  const { data: rawEmployees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const res = await api.get('employees/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const employees = Array.isArray(rawEmployees) ? rawEmployees : rawEmployees?.results || [];

  const { data: rawPayrolls = [], isLoading: loadingPayrolls } = useQuery({
    queryKey: [QUERY_KEYS.PAYROLL],
    queryFn: async () => {
      const res = await api.get('payroll/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const allPayrolls = Array.isArray(rawPayrolls) ? rawPayrolls : rawPayrolls?.results || [];


  return { employees, allPayrolls, loadingEmployees, loadingPayrolls };
}
