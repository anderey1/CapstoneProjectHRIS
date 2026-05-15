import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle2, XCircle, Clock as ClockIcon, ShieldCheck, ChevronRight, User, FileText, CalendarRange } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

/**
 * Leaves Management (Admin/HR View)
 * 
 * Simple, professional redesign for managing staff leave requests.
 */
const LeaveManagement = () => {
   const queryClient = useQueryClient();
   const [activeTab, setActiveTab] = useState('pending');
   const [selectedLeave, setSelectedLeave] = useState(null);

   // 1. Data Fetching
   const { data: leaves = [], isLoading } = useQuery({
      queryKey: [QUERY_KEYS.LEAVES],
      queryFn: async () => {
         const res = await api.get('leaves/');
         return Array.isArray(res.data) ? res.data : res.data.results || [];
      }
   });

   // 2. Mutations
   const approveMutation = useMutation({
      mutationFn: (id) => api.post(`leaves/${id}/approve/`),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
         setSelectedLeave(null);
      },
      onError: (err) => alert(err.response?.data?.detail || "Approval failed.")
   });

   const rejectMutation = useMutation({
      mutationFn: (id) => api.post(`leaves/${id}/reject/`),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
         setSelectedLeave(null);
      },
      onError: (err) => alert(err.response?.data?.detail || "Rejection failed.")
   });

   const filteredLeaves = leaves.filter(l => activeTab === 'pending' ? l.status === 'pending' : l.status !== 'pending');

   if (isLoading) return (
      <div className="p-8 flex justify-center h-[60vh] items-center">
         <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
   );

   return (
      <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
         
         {/* Page Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                     <CalendarRange className="w-5 h-5" />
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Leaves</h1>
               </div>
               <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">Review staff requests</p>
            </div>
         </div>

         {/* Simple Tabs */}
         <div className="flex gap-2 bg-base-200/50 p-1 rounded-xl w-fit border border-base-200">
            <button
               className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-white text-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}
               onClick={() => setActiveTab('pending')}
            >
               Pending
            </button>
            <button
               className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}
               onClick={() => setActiveTab('history')}
            >
               Resolved
            </button>
         </div>

         {/* Leave Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLeaves.length > 0 ? (
               filteredLeaves.map((leave) => (
                  <div key={leave.id} className="bg-white border border-base-200 shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group">
                     <div className="p-6 space-y-6">
                        
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-base-50 border border-base-200 flex items-center justify-center text-primary font-black uppercase text-xs">
                                 {leave.employee_name.charAt(0)}
                              </div>
                              <div>
                                 <p className="font-bold text-sm text-base-content leading-tight">{leave.employee_name}</p>
                                 <p className="text-[10px] font-black opacity-30 uppercase tracking-tighter">{leave.department || 'General Service'}</p>
                              </div>
                           </div>
                           <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                 leave.status === 'approved' ? 'bg-success/10 text-success' :
                                 leave.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                              }`}>
                              {leave.status}
                           </div>
                        </div>

                        <div className="space-y-2 py-4 border-y border-base-50">
                           <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 opacity-30" />
                              <span className="text-[11px] font-bold text-base-content uppercase tracking-tight">{leave.leave_type} Leave</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <ClockIcon className="w-3.5 h-3.5 opacity-30" />
                              <span className="text-[11px] font-medium opacity-60">
                                 {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                              </span>
                           </div>
                        </div>

                        <div className="bg-base-50/50 p-4 rounded-lg border border-base-100">
                           <p className="text-[11px] font-medium italic opacity-60 line-clamp-2 leading-relaxed">"{leave.reason}"</p>
                        </div>

                        <button
                           onClick={() => setSelectedLeave(leave)}
                           className="btn btn-ghost btn-block bg-base-50 border-base-200 hover:bg-primary/5 hover:text-primary hover:border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest group transition-all"
                        >
                           Check Request
                           <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform ml-1" />
                        </button>
                     </div>
                  </div>
               ))
            ) : (
               <div className="col-span-full py-40 bg-white rounded-xl border border-dashed border-base-300 flex flex-col items-center justify-center text-center opacity-30">
                  <CalendarRange className="w-12 h-12 mb-3" />
                  <p className="text-lg font-black uppercase tracking-widest">No {activeTab} leaves</p>
               </div>
            )}
         </div>

         {/* Decision Modal */}
         {selectedLeave && (
            <div className="modal modal-open">
               <div className="modal-box rounded-xl max-w-md p-0 overflow-hidden shadow-2xl border border-base-300 bg-white">
                  <div className="bg-base-50/50 border-b border-base-200 p-6 flex items-center justify-between">
                    <div>
                       <h3 className="font-black text-lg text-base-content uppercase tracking-tight">{selectedLeave.employee_name}</h3>
                       <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">{selectedLeave.department || 'Personnel'}</p>
                    </div>
                    <button onClick={() => setSelectedLeave(null)} className="btn btn-ghost btn-sm btn-circle"><XCircle className="w-5 h-5 opacity-40" /></button>
                  </div>

                  <div className="p-8 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-base-50 border border-base-200 rounded-lg">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Type</p>
                           <p className="font-bold text-sm text-primary uppercase">{selectedLeave.leave_type}</p>
                        </div>
                        <div className="p-4 bg-base-50 border border-base-200 rounded-lg">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Dates</p>
                           <p className="font-bold text-[10px]">
                             {new Date(selectedLeave.start_date).toLocaleDateString()} - {new Date(selectedLeave.end_date).toLocaleDateString()}
                           </p>
                        </div>
                     </div>

                     <div className="p-5 bg-base-50 border border-base-200 rounded-lg">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Reason</p>
                        <p className="text-xs font-medium leading-relaxed italic text-gray-600">"{selectedLeave.reason}"</p>
                     </div>

                     {selectedLeave.status === 'pending' ? (
                        <div className="grid grid-cols-2 gap-4 pt-4">
                           <button
                              onClick={() => rejectMutation.mutate(selectedLeave.id)}
                              disabled={rejectMutation.isPending}
                              className="btn btn-outline border-base-300 text-error hover:bg-error/5 hover:border-error/20 rounded-lg font-black text-[11px] uppercase tracking-widest h-12"
                           >
                              Reject
                           </button>
                           <button
                              onClick={() => approveMutation.mutate(selectedLeave.id)}
                              disabled={approveMutation.isPending}
                              className="btn btn-primary rounded-lg font-black text-[11px] uppercase tracking-widest h-12 shadow-md shadow-primary/20"
                           >
                              Approve
                           </button>
                        </div>
                     ) : (
                        <button onClick={() => setSelectedLeave(null)} className="btn btn-block bg-base-100 border-base-200 rounded-lg font-black text-xs uppercase tracking-widest">Close Record</button>
                     )}
                  </div>
               </div>
               <div className="modal-backdrop bg-black/40" onClick={() => setSelectedLeave(null)}></div>
            </div>
         )}
      </div>
   );
};

export default LeaveManagement;
