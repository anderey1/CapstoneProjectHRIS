import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, CheckCircle2, XCircle, Clock as ClockIcon, CalendarCheck, CalendarRange, FileText } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

/**
 * My Leaves (Employee View)
 * 
 * Simple, professional redesign for staff to track credits and apply for leave.
 */
const MyLeaves = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Data Fetching
  const { data: employee } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('employees/me/');
      return res.data;
    }
  });

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.LEAVES],
    queryFn: async () => {
      const res = await api.get('leaves/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    }
  });

  // 2. Mutations
  const applyMutation = useMutation({
    mutationFn: (newLeave) => api.post('leaves/', newLeave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      queryClient.invalidateQueries({ queryKey: ['me'] }); 
      setIsModalOpen(false);
    },
    onError: (err) => alert(err.response?.data?.detail || "Application failed.")
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    applyMutation.mutate(Object.fromEntries(formData.entries()));
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
              <CalendarRange className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">My Leaves</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Track credits and history</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-8"
        >
          <Plus className="w-4 h-4 mr-2" />
          Apply
        </button>
      </div>

      {/* Credit Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-base-200 p-8 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="z-10">
            <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-2">Sick Leave</p>
            <h2 className="text-5xl font-black text-success flex items-baseline gap-2">
              {employee?.sick_leave_balance || 0}
              <span className="text-[10px] opacity-30 tracking-widest">DAYS</span>
            </h2>
          </div>
          <div className="p-5 bg-success/5 text-success rounded-xl z-10 group-hover:scale-110 transition-transform border border-success/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white border border-base-200 p-8 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="z-10">
            <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-2">Vacation Leave</p>
            <h2 className="text-5xl font-black text-primary flex items-baseline gap-2">
              {employee?.vacation_leave_balance || 0}
              <span className="text-[10px] opacity-30 tracking-widest">DAYS</span>
            </h2>
          </div>
          <div className="p-5 bg-primary/5 text-primary rounded-xl z-10 group-hover:scale-110 transition-transform border border-primary/10">
            <CalendarCheck className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <ClockIcon className="w-4 h-4 text-primary opacity-40" />
          <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40">My History</h2>
        </div>
        
        {leaves.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaves.map((leave) => (
              <div key={leave.id} className="bg-white border border-base-200 shadow-sm hover:shadow-md transition-all rounded-xl p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="px-2 py-0.5 rounded-lg font-black uppercase text-[9px] tracking-widest bg-base-50 text-base-content/50 border border-base-100">
                    {leave.leave_type}
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      leave.status === 'approved' ? 'bg-success/10 text-success' :
                      leave.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                    }`}>
                    {leave.status}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-base-content flex items-center gap-2">
                    {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] font-black opacity-30 uppercase tracking-tight">Filed: {new Date(leave.date_applied).toLocaleDateString()}</p>
                </div>

                <div className="bg-base-50/50 p-4 rounded-lg border border-base-50">
                  <p className="text-[11px] font-medium italic opacity-60 line-clamp-2">"{leave.reason}"</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center opacity-30 italic font-black uppercase tracking-widest bg-white rounded-xl border border-dashed border-base-300">
             No records found
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-xl p-0 overflow-hidden border border-base-300 max-w-md shadow-2xl bg-white">
            <div className="bg-base-50/50 border-b border-base-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-base-content uppercase tracking-tight">Apply for Leave</h3>
                <p className="text-[10px] font-black opacity-30 mt-1 uppercase tracking-widest">Official Request Form</p>
              </div>
              <button 
                className="btn btn-ghost btn-sm btn-circle" 
                onClick={() => setIsModalOpen(false)}
              >
                <XCircle className="w-5 h-5 opacity-40" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Type</label>
                <select name="leave_type" className="select select-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-sm font-bold" required>
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Start</label>
                  <input name="start_date" type="date" className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">End</label>
                  <input name="end_date" type="date" className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Reason</label>
                <textarea 
                  name="reason" 
                  className="textarea textarea-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg h-24 text-xs font-medium leading-relaxed" 
                  placeholder="Why are you taking leave?" 
                  required
                ></textarea>
              </div>

              <div className="pt-6 border-t border-base-100 flex gap-4">
                <button 
                  type="button" 
                  className="btn btn-ghost flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`btn btn-primary flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20 ${applyMutation.isPending ? 'loading' : ''}`}
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? 'Sending...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;
