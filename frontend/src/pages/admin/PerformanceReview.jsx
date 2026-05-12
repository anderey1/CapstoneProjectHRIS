import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { CheckCircle, XCircle, Plus } from 'lucide-react';
import PerformanceFormModal from '../../components/features/performance/PerformanceFormModal';

const PerformanceReview = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PERFORMANCE],
    queryFn: async () => {
      const res = await api.get('performance/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`performance/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERFORMANCE] }),
  });

  const handleDelete = (id) => {
    if (window.confirm('Delete this review?')) deleteMutation.mutate(id);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Performance Reviews</h1>
        <button
          className="btn btn-primary btn-sm flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4" /> Add Review
        </button>
      </div>
      {isLoading ? (
        <div className="flex justify-center p-8"><span className="loading loading-dots loading-lg" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="opacity-50">
                <th>Employee</th>
                <th>Period</th>
                <th>Scores</th>
                <th>Eligible</th>
                <th>Evaluation Summary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews?.map((r) => (
                <tr key={r.id} className="hover:bg-base-200/50">
                  <td>{r.employee_name}</td>
                  <td>{r.period}</td>
                  <td className="flex gap-2">
                    <span className="badge badge-success badge-sm">Punct:{r.punctuality_score}</span>
                    <span className="badge badge-info badge-sm">Qual:{r.quality_score}</span>
                    <span className="badge badge-warning badge-sm">Behav:{r.behavior_score}</span>
                  </td>
                  <td>{r.is_promotion_eligible ? <CheckCircle className="w-5 h-5 text-success" /> : <XCircle className="w-5 h-5 text-error" />}</td>
                  <td className="max-w-xs">
                    <p className="text-xs italic line-clamp-2" title={r.ai_summary}>
                      {r.ai_summary || 'No summary generated'}
                    </p>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost btn-sm text-error"
                      onClick={() => handleDelete(r.id)}
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && <PerformanceFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default PerformanceReview;
