import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, CheckCircle2, XCircle, Clock as ClockIcon, CalendarCheck } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

const MyLeaves = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const applyMutation = useMutation({
    mutationFn: (newLeave) => api.post('leaves/', newLeave),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      queryClient.invalidateQueries({ queryKey: ['me'] }); // Refresh balances
      setIsModalOpen(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    applyMutation.mutate(Object.fromEntries(formData.entries()));
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-base-content flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            My Leaves
          </h1>
          <p className="text-sm opacity-50 font-medium mt-1">Track your leave applications and current balances.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-lg rounded-2xl shadow-xl shadow-primary/20">
          <Plus className="w-5 h-5" />
          Apply for Leave
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-base-100 border border-base-300 p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl relative overflow-hidden group">
          <div className="z-10">
            <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-2">Sick Leave Credit</p>
            <h2 className="text-5xl font-black text-success flex items-baseline gap-2">
              {employee?.sick_leave_balance || 0}
              <span className="text-sm opacity-30">DAYS</span>
            </h2>
          </div>
          <div className="p-5 bg-success/10 text-success rounded-3xl z-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-success">
            <Clock size={200} />
          </div>
        </div>

        <div className="bg-base-100 border border-base-300 p-8 rounded-[2.5rem] flex items-center justify-between shadow-xl relative overflow-hidden group">
          <div className="z-10">
            <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-2">Vacation Leave Credit</p>
            <h2 className="text-4xl font-black text-info flex items-baseline gap-2">
              {employee?.vacation_leave_balance || 0}
              <span className="text-sm opacity-30">DAYS</span>
            </h2>
          </div>
          <div className="p-5 bg-info/10 text-info rounded-3xl z-10 group-hover:scale-110 transition-transform">
            <Plus className="w-10 h-10" />
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-[0.03] text-info">
            <CalendarCheck className="w-200 h-200" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black">Application History</h2>
        {isLoading ? (
          <div className="flex justify-center p-20"><span className="loading loading-spinner text-primary loading-lg"></span></div>
        ) : leaves.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {leaves.map((leave) => (
              <div key={leave.id} className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow rounded-3xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="badge badge-lg rounded-xl font-black uppercase text-[10px] tracking-widest bg-base-200 border-none">
                    {leave.leave_type}
                  </div>
                  <div className={`badge badge-sm font-bold uppercase ${leave.status === 'approved' ? 'badge-success text-white' :
                      leave.status === 'rejected' ? 'badge-error text-white' : 'badge-warning'
                    }`}>
                    {leave.status}
                  </div>
                </div>

                <div className="space-y-1 mb-6">
                  <p className="text-sm font-black flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 opacity-30" />
                    {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-tight">Applied on {new Date(leave.date_applied).toLocaleDateString()}</p>
                </div>

                <div className="bg-base-200/50 p-4 rounded-2xl">
                  <p className="text-xs italic opacity-70 line-clamp-2">"{leave.reason}"</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center opacity-30 italic font-medium">No leave requests found.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl p-0 overflow-hidden border border-base-300 max-w-md shadow-xl bg-white">
            {/* Header: Solid & Professional */}
            <div className="bg-base-100 border-b border-base-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl">Apply for Leave</h3>
                <p className="text-xs opacity-50 mt-1">Official Personnel Leave Request Form</p>
              </div>
              <button 
                className="btn btn-ghost btn-sm btn-circle" 
                onClick={() => setIsModalOpen(false)}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Leave Category</span></label>
                <select name="leave_type" className="select select-bordered w-full bg-base-100 rounded-lg font-medium" required>
                  <option value="sick">Sick Leave</option>
                  <option value="vacation">Vacation Leave</option>
                  <option value="emergency">Emergency Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Start Date</span></label>
                  <input name="start_date" type="date" className="input input-bordered w-full bg-base-100 rounded-lg font-medium" required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">End Date</span></label>
                  <input name="end_date" type="date" className="input input-bordered w-full bg-base-100 rounded-lg font-medium" required />
                </div>
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-semibold">Reason / Justification</span></label>
                <textarea 
                  name="reason" 
                  className="textarea textarea-bordered w-full bg-base-100 rounded-lg h-28 font-medium leading-relaxed" 
                  placeholder="State your reason for leave..." 
                  required
                ></textarea>
              </div>

              <div className="modal-action mt-8 pt-4 border-t border-base-200 bg-base-50 p-6 -mx-8 -mb-8">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`btn btn-primary px-10 ${applyMutation.isPending ? 'loading' : ''}`}
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/60" onClick={() => setIsModalOpen(false)}></div>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;
