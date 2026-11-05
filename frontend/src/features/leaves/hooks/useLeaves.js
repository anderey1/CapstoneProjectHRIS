import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { useToast } from '../../../context/ToastContext';
import { usePaginatedList } from '../../../hooks/usePaginatedList';
import { manilaToday, isCalendarDate } from '../utils/leaveApplication';

/**
 * Utility: Calculate working days (Mon-Fri) between two dates inclusive
 */
export const calculateWorkingDays = (start, end, holidays = []) => {
  if (!isCalendarDate(start) || !isCalendarDate(end)) return 0;
  const sDate = new Date(start);
  const eDate = new Date(end);
  if (sDate > eDate) return 0;
  let count = 0;
  const excluded = new Set(holidays.filter(day => day.category !== 'special_working').map(day => day.date));
  let current = new Date(sDate);
  while (current <= eDate) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6 && !excluded.has(current.toISOString().slice(0, 10))) {
      count++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return count;
};

export function useLeaveCalendar(start, end, enabled, usesCalendarDays) {
  const currentYear = Number(manilaToday().slice(0, 4));
  const years = new Set([currentYear]);
  if (!usesCalendarDays && isCalendarDate(start) && isCalendarDate(end) && start <= end) {
    for (let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year++) years.add(year);
  }
  const queries = useQueries({ queries: [...years].map(year => ({
    queryKey: [QUERY_KEYS.LEAVE_CALENDAR, year],
    queryFn: async () => {
      const { data } = await api.get('leaves/calendar/', { params: { year } });
      if (data.coverage !== 'reviewed' || !Array.isArray(data.holidays) || !data.today) {
        throw new Error('The leave calendar has not been reviewed.');
      }
      return data;
    },
    enabled,
    retry: false,
    staleTime: 0,
    refetchInterval: 60_000,
  })) });
  const failed = queries.find(query => query.isError);
  return {
    ready: queries.every(query => query.isSuccess),
    error: failed ? 'Leave calendar unavailable. Ask HR to update the reviewed calendar or retry.' : '',
    today: queries[0]?.data?.today || manilaToday(),
    holidays: queries.flatMap(query => query.data?.holidays || []),
    retry: () => queries.forEach(query => query.refetch()),
  };
}

/**
 * Custom Domain Hook for Leaves Management & Self-Service Applications
 */
export function useLeaves(params = {}) {
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
  const { records: leaves, summary, pagination, isLoading: isLeavesLoading, isError, error } =
    usePaginatedList(QUERY_KEYS.LEAVES, 'leaves/', params);

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
    mutationFn: ({ id, signature, signatureConfirmed, expectedStatus }) => {
      const data = new FormData();
      if (signature) data.append('signature', signature);
      data.append('signature_confirmed', String(!!signatureConfirmed));
      if (expectedStatus) data.append('expected_status', expectedStatus);
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
    summary,
    pagination,
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
