import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../api/queryKeys';
import api from '../../../api/axios';
import { usePaginatedList } from '../../../hooks/usePaginatedList';

/**
 * Custom hook to encapsulate applicant queries and administrative mutations.
 */
export const useRecruitment = (params = {}) => {
  const queryClient = useQueryClient();

  const { records: applicants, summary, pagination, isLoading } = usePaginatedList(QUERY_KEYS.APPLICANTS, 'applicants/', params);

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }) =>
      api.post(`applicants/${id}/change-status/`, { status, notes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] });
      alert(res.data.message || 'Status updated successfully.');
    },
    onError: (err) => alert(err.response?.data?.error || 'Status update failed.'),
  });

  const updateScoresMutation = useMutation({
    mutationFn: ({ id, scores }) => api.patch(`applicants/${id}/`, scores),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] });
      alert('Scores updated successfully.');
    },
    onError: () => alert('Failed to update scores.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`applicants/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] }),
  });

  return {
    applicants,
    summary,
    pagination,
    isLoading,
    changeStatus: statusMutation.mutateAsync,
    isChangingStatus: statusMutation.isPending,
    updateScores: updateScoresMutation.mutateAsync,
    isUpdatingScores: updateScoresMutation.isPending,
    deleteApplicant: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
