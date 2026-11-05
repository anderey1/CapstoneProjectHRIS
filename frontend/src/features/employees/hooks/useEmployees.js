import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { useToast } from '../../../context/ToastContext';
import { buildEmployeePayload } from '../utils/employeePayload';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import { fetchAllPages } from '../../../api/pagination';

/**
 * Custom Domain Hook for Personnel & Employee Management
 */
export function useEmployees(params = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();

  // 1. Fetch Employees List
  const { records: employees, summary, pagination, isLoading: isEmployeesLoading, isError, error } =
    usePaginatedList(QUERY_KEYS.EMPLOYEES, 'employees/', params);

  // 2. Fetch Schools Registry
  const { data: rawSchools = [], isLoading: isSchoolsLoading } = useQuery({
    queryKey: [QUERY_KEYS.SCHOOLS || 'schools'],
    queryFn: ({ signal }) => fetchAllPages('schools/', {}, signal),
  });

  const schools = Array.isArray(rawSchools) ? rawSchools : rawSchools?.results || [];

  const invalidateEmployees = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_STAFF] });
  };

  // 3. Add Mutation
  const addMutation = useMutation({
    mutationFn: (newEmployee) => api.post('employees/', newEmployee),
    onSuccess: () => {
      invalidateEmployees();
      toast.success('Employee added successfully!');
    },
    onError: (err) => {
      const detail = err.response?.data?.detail || 'Failed to add employee.';
      toast.error(detail);
    },
  });

  // 4. Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`employees/${id}/`, data),
    onSuccess: () => {
      invalidateEmployees();
      toast.success('Record updated successfully!');
    },
    onError: (err) => {
      const detail = err.response?.data?.detail || 'Update failed.';
      toast.error(detail);
    },
  });

  // 5. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`employees/${id}/`),
    onSuccess: () => {
      invalidateEmployees();
      toast.info('Employee removed.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to delete employee.');
    },
  });

  // 6. Pending Registrations Query
  const { records: pendingRegistrations, pagination: pendingPagination, isLoading: isPendingLoading } =
    usePaginatedList(QUERY_KEYS.PENDING_REGISTRATIONS, 'employees/pending-registrations/');

  // 7. Approve Registration Mutation
  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`employees/${id}/approve-registration/`),
    onSuccess: (res) => {
      invalidateEmployees();
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] });
      toast.success(res.data?.message || 'Registration approved.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to approve registration.');
    }
  });

  // 8. Reject Registration Mutation
  const rejectMutation = useMutation({
    mutationFn: (id) => api.post(`employees/${id}/reject-registration/`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['pendingRegistrations'] });
      toast.info(res.data?.message || 'Registration request rejected.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to reject registration.');
    }
  });

  // 9. Unified Save Handler (Handles FormData vs JSON building)
  const saveEmployee = async (formData, employeeId = null) => {
    const payload = buildEmployeePayload(formData);
    if (employeeId) {
      return await updateMutation.mutateAsync({ id: employeeId, data: payload });
    }
    return await addMutation.mutateAsync(payload);
  };

  return {
    employees,
    summary,
    pagination,
    pendingPagination,
    exportEmployees: () => fetchAllPages('employees/', params),
    schools,
    pendingRegistrations,
    isLoading: isEmployeesLoading || isSchoolsLoading,
    isPendingLoading,
    isError,
    error,
    addEmployee: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateEmployee: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteEmployee: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    approveRegistration: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    rejectRegistration: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
    isSaving: addMutation.isPending || updateMutation.isPending,
    saveEmployee,
  };
}
