import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { CheckCircle, XCircle, Plus, FileText } from 'lucide-react';
import IPCRFFormModal from '../../components/features/performance/IPCRFFormModal';

const IPCRFManagement = () => {
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
    if (window.confirm('Delete this IPCRF record?')) deleteMutation.mutate(id);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-base-content flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            IPCRF Management
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Individual Performance Commitment and Review Form records.</p>
        </div>
        <button
          className="btn btn-primary rounded-2xl flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-5 h-5" /> New IPCRF Rating
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><span className="loading loading-dots loading-lg" /></div>
      ) : (
        <div className="bg-base-100 rounded-3xl shadow-xl border border-base-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200/50">
                <tr className="border-b border-base-300 uppercase text-[10px] tracking-widest font-black opacity-50">
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Scores</th>
                  <th className="px-6 py-4">Eligibility</th>
                  <th className="px-6 py-4">Evaluation Summary</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(reviews) ? reviews : [])?.map((r) => (
                  <tr key={r.id}>
                    <td className="px-6 py-4 font-bold">{r.employee_name}</td>
                    <td className="px-6 py-4">{r.period}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        <span className="badge badge-success badge-xs font-bold text-[10px]">P:{r.punctuality_score}</span>
                        <span className="badge badge-info badge-xs font-bold text-[10px]">Q:{r.quality_score}</span>
                        <span className="badge badge-warning badge-xs font-bold text-[10px]">B:{r.behavior_score}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        {r.is_promotion_eligible 
                            ? <span className="badge badge-success badge-sm text-white font-bold">ELIGIBLE</span> 
                            : <span className="badge badge-ghost badge-sm opacity-50">STABLE</span>}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-xs italic line-clamp-2 text-base-content/70">
                        {r.ai_summary}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="btn btn-ghost btn-xs text-error font-bold"
                        onClick={() => handleDelete(r.id)}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showModal && <IPCRFFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default IPCRFManagement;
