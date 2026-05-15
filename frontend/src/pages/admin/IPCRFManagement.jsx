import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../api/queryKeys';
import api from '../../api/axios';
import { CheckCircle, XCircle, Plus, FileText, BarChart3, Trash2 } from 'lucide-react';
import IPCRFFormModal from '../../components/features/performance/IPCRFFormModal';

/**
 * Performance Ratings (IPCRF Management)
 * 
 * Simple, professional redesign for performance evaluations.
 */
const IPCRFManagement = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  // 1. Data Fetching
  const { data: reviews, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.PERFORMANCE],
    queryFn: async () => {
      const res = await api.get('performance/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  // 2. Mutations
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`performance/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERFORMANCE] }),
  });

  const handleDelete = (id) => {
    if (window.confirm('Delete this rating record?')) deleteMutation.mutate(id);
  };

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Performance</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Staff ratings and summaries</p>
        </div>
        
        <button
          className="btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-8"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Rate Performance
        </button>
      </div>

      {/* Ratings Table */}
      <div className="bg-white rounded-xl shadow-sm border border-base-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-50/50 border-b border-base-200 uppercase text-[10px] tracking-widest font-black opacity-50">
                <th className="px-6 py-4 text-primary">Employee</th>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Scores</th>
                <th className="px-6 py-4">Eligibility</th>
                <th className="px-6 py-4">Summary</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-100">
              {(Array.isArray(reviews) ? reviews : [])?.map((r) => (
                <tr key={r.id} className="hover:bg-base-50/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm text-base-content">{r.employee_name}</td>
                  <td className="px-6 py-4 text-xs font-medium opacity-60 uppercase">{r.period}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className="badge badge-outline border-success/30 text-success font-black text-[9px] px-2 py-2">P:{r.punctuality_score}</span>
                      <span className="badge badge-outline border-primary/30 text-primary font-black text-[9px] px-2 py-2">Q:{r.quality_score}</span>
                      <span className="badge badge-outline border-warning/30 text-warning font-black text-[9px] px-2 py-2">B:{r.behavior_score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                      {r.is_promotion_eligible 
                          ? <span className="px-3 py-1 bg-success/10 text-success rounded-full text-[9px] font-black uppercase tracking-wider">Eligible</span> 
                          : <span className="px-3 py-1 bg-base-100 text-base-content/40 rounded-full text-[9px] font-black uppercase tracking-wider">Regular</span>}
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-[11px] italic font-medium leading-relaxed opacity-60 line-clamp-2">
                      {r.ai_summary}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="btn btn-ghost btn-xs text-error font-black hover:bg-error/5"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {(!reviews || reviews.length === 0) && (
                <tr>
                  <td colSpan="6" className="text-center py-20 opacity-30 italic text-xs uppercase tracking-widest">No ratings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <IPCRFFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default IPCRFManagement;
