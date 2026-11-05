import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../api/queryKeys';
import api from '../../../api/axios';

/**
 * Custom hook to encapsulate applicant queries and administrative mutations.
 */
export const useRecruitment = (selectedApplicantId = null) => {
  const queryClient = useQueryClient();

  const { data: applicants = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.APPLICANTS],
    queryFn: async () => {
      const res = await api.get('applicants/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

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
    isLoading,
    changeStatus: statusMutation.mutateAsync,
    isChangingStatus: statusMutation.isPending,
    updateScores: updateScoresMutation.mutateAsync,
    isUpdatingScores: updateScoresMutation.isPending,
    deleteApplicant: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};
