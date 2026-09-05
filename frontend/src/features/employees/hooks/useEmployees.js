import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { useToast } from '../../../context/ToastContext';
import { buildEmployeePayload } from '../utils/employeePayload';

/**
 * Custom Domain Hook for Personnel & Employee Management
 */
export function useEmployees() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // 1. Fetch Employees List
  const { data: rawEmployees = [], isLoading: isEmployeesLoading, isError, error } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const response = await api.get('employees/');
      return Array.isArray(response.data) ? response.data : response.data.results || [];
    },
  });

  const employees = Array.isArray(rawEmployees) ? rawEmployees : rawEmployees?.results || [];

  // 2. Fetch Schools Registry
  const { data: rawSchools = [], isLoading: isSchoolsLoading } = useQuery({
    queryKey: [QUERY_KEYS.SCHOOLS || 'schools'],
    queryFn: async () => {
      const res = await api.get('schools/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const schools = Array.isArray(rawSchools) ? rawSchools : rawSchools?.results || [];

  const invalidateEmployees = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
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

  // 6. Unified Save Handler (Handles FormData vs JSON building)
  const saveEmployee = async (formData, employeeId = null) => {
    const payload = buildEmployeePayload(formData);
    if (employeeId) {
      return await updateMutation.mutateAsync({ id: employeeId, data: payload });
    }
    return await addMutation.mutateAsync(payload);
  };

  return {
    employees,
    schools,
    isLoading: isEmployeesLoading || isSchoolsLoading,
    isError,
    error,
    addEmployee: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateEmployee: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteEmployee: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isSaving: addMutation.isPending || updateMutation.isPending,
    saveEmployee,
  };
}
