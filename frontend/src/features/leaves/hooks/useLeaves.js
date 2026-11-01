import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { useToast } from '../../../context/ToastContext';

/**
 * Utility: Calculate working days (Mon-Fri) between two dates inclusive
 */
export const calculateWorkingDays = (start, end) => {
  if (!start || !end) return 0;
  const sDate = new Date(start);
  const eDate = new Date(end);
  if (sDate > eDate) return 0;
  let count = 0;
  let current = new Date(sDate);
  while (current <= eDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

/**
 * Custom Domain Hook for Leaves Management & Self-Service Applications
 */
export function useLeaves() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // 1. Fetch Current Employee Profile (for balances & supervisor checks)
  const { data: employee, isLoading: isEmployeeLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('employees/me/');
      return res.data;
    },
  });

  // 2. Fetch All Leaves (or user-scoped leaves from DRF)
  const { data: leaves = [], isLoading: isLeavesLoading, isError, error } = useQuery({
    queryKey: [QUERY_KEYS.LEAVES],
    queryFn: async () => {
      const leaves = [];
      let page = 1;
      while (true) {
        const res = await api.get('leaves/', { params: { page } });
        if (Array.isArray(res.data)) return res.data;
        leaves.push(...(res.data.results || []));
        if (!res.data.next) return leaves;
        page += 1;
      }
    },
  });

  // 3. Apply Leave Mutation
  const applyMutation = useMutation({
    mutationFn: ({ formData, id }) => id
      ? api.patch(`leaves/${id}/`, formData)
      : api.post('leaves/', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success('Leave application submitted successfully!');
    },
    onError: (err) => {
      const errorData = err.response?.data;
      let msg = 'Application failed. Please check requirements.';
      if (errorData) {
        if (typeof errorData === 'string') msg = errorData;
        else if (errorData.detail) msg = errorData.detail;
        else if (typeof errorData === 'object') {
          msg = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors[0] : errors}`)
            .join(' | ');
        }
      }
      toast.error(msg);
    },
  });

  // 4. Approve Leave Mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, signature, signatureConfirmed, recordsReference, expectedStatus }) => {
      const data = new FormData();
      if (signature) data.append('signature', signature);
      data.append('signature_confirmed', String(!!signatureConfirmed));
      if (expectedStatus) data.append('expected_status', expectedStatus);
      if (recordsReference) data.append('records_reference', recordsReference);
      return api.post(`leaves/${id}/approve/`, data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(response.data.message);
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Approval failed.');
    },
  });

  // 5. Reject Leave Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      api.post(`leaves/${id}/reject/`, { disapproval_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.info('Leave application rejected.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Rejection failed.');
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, reason }) => api.post(`leaves/${id}/return-for-correction/`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      toast.info('Application returned for correction.');
    },
    onError: err => toast.error(err.response?.data?.detail || 'Could not return application.'),
  });

  // Filtered views
  const myLeaves = leaves.filter((l) => l.employee === employee?.id);
  const teamLeaves = leaves.filter((l) => l.employee !== employee?.id);

  return {
    leaves,
    employee,
    myLeaves,
    teamLeaves,
    isLoading: isLeavesLoading || isEmployeeLoading,
    isError,
    error,
    applyLeave: applyMutation.mutateAsync,
    isApplying: applyMutation.isPending,
    approveLeave: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    rejectLeave: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
    returnLeave: returnMutation.mutateAsync,
    isReturning: returnMutation.isPending,
    calculateWorkingDays,
  };
}
