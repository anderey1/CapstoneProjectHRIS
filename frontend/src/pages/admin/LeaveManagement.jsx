import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle2, XCircle, Clock as ClockIcon, ShieldCheck, ChevronRight, User, FileText } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

const LeaveManagement = () => {
   const queryClient = useQueryClient();
   const [activeTab, setActiveTab] = useState('pending');
   const [selectedLeave, setSelectedLeave] = useState(null);

   const { data: leaves = [], isLoading } = useQuery({
      queryKey: [QUERY_KEYS.LEAVES],
      queryFn: async () => {
         const res = await api.get('leaves/');
         return Array.isArray(res.data) ? res.data : res.data.results || [];
      }
   });

   const approveMutation = useMutation({
      mutationFn: (id) => api.post(`leaves/${id}/approve/`),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
         setSelectedLeave(null);
      },
      onError: (err) => {
         alert(err.response?.data?.detail || "Failed to approve leave request.");
      }
   });

   const rejectMutation = useMutation({
      mutationFn: (id) => api.post(`leaves/${id}/reject/`),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
         setSelectedLeave(null);
      },
      onError: (err) => {
         alert(err.response?.data?.detail || "Failed to reject leave request.");
      }
   });

   const filteredLeaves = leaves.filter(l => activeTab === 'pending' ? l.status === 'pending' : l.status !== 'pending');

   return (
      <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-black text-base-content flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                  Leave Management
               </h1>
               <p className="text-sm opacity-50 font-medium mt-1">Review and manage official personnel leave requests.</p>
            </div>
         </div>

         {/* Tabs */}
         <div className="tabs tabs-boxed bg-base-100 p-1 rounded-2xl w-fit shadow-md border border-base-300">
            <button
               className={`tab tab-lg rounded-xl font-bold px-8 transition-all ${activeTab === 'pending' ? 'tab-active bg-primary text-white' : 'opacity-50'}`}
               onClick={() => setActiveTab('pending')}
            >
               Pending Requests
            </button>
            <button
               className={`tab tab-lg rounded-xl font-bold px-8 transition-all ${activeTab === 'history' ? 'tab-active bg-primary text-white' : 'opacity-50'}`}
               onClick={() => setActiveTab('history')}
            >
               Resolution History
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
               <div className="col-span-full flex justify-center p-20"><span className="loading loading-spinner text-primary loading-lg"></span></div>
            ) : filteredLeaves.length > 0 ? (
               filteredLeaves.map((leave) => (
                  <div key={leave.id} className="card bg-base-100 border border-base-300 shadow-xl rounded-[2.5rem] overflow-hidden group">
                     <div className="card-body p-8">
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center text-primary font-black uppercase">
                                 {leave.employee_name.charAt(0)}
                              </div>
                              <div>
                                 <p className="font-black text-lg leading-tight">{leave.employee_name}</p>
                                 <p className="text-[10px] font-bold opacity-40 uppercase">{leave.department || 'General Service'}</p>
                              </div>
                           </div>
                           <div className={`badge badge-sm font-bold uppercase ${leave.status === 'approved' ? 'badge-success text-white' :
                                 leave.status === 'rejected' ? 'badge-error text-white' : 'badge-warning'
                              }`}>
                              {leave.status}
                           </div>
                        </div>

                        <div className="space-y-4 mb-8">
                           <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 opacity-30" />
                              <span className="text-sm font-black capitalize">{leave.leave_type} Leave Request</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <ClockIcon className="w-4 h-4 opacity-30" />
                              <span className="text-sm font-bold italic">
                                 {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}
                              </span>
                           </div>
                        </div>

                        <div className="bg-base-200/50 p-5 rounded-2xl mb-8">
                           <p className="text-xs font-medium italic opacity-70 line-clamp-2 leading-relaxed">"{leave.reason}"</p>
                        </div>

                        <button
                           onClick={() => setSelectedLeave(leave)}
                           className="btn btn-primary btn-block rounded-2xl group"
                        >
                           Review & Decide
                           <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                     </div>
                  </div>
               ))
            ) : (
               <div className="col-span-full py-40 text-center opacity-30 italic font-bold text-2xl uppercase tracking-widest border-4 border-dashed border-base-300 rounded-[3rem]">
                  No {activeTab} requests
               </div>
            )}
         </div>

         {/* Decision Modal */}
         {selectedLeave && (
            <div className="modal modal-open">
               <div className="modal-box rounded-2xl max-w-lg p-0 overflow-hidden shadow-xl border border-base-300 bg-white">
                  <div className="bg-base-100 border-b border-base-200 p-6 flex items-center justify-between">
                    <div>
                       <h3 className="font-bold text-xl">{selectedLeave.employee_name}</h3>
                       <p className="text-xs opacity-50 uppercase tracking-widest">{selectedLeave.department || 'Personnel'}</p>
                    </div>
                    <button onClick={() => setSelectedLeave(null)} className="btn btn-ghost btn-sm btn-circle"><XCircle className="w-5 h-5" /></button>
                  </div>

                  <div className="p-8 space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-base-50 border border-base-200 rounded-xl">
                           <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Leave Type</p>
                           <p className="font-bold capitalize text-primary">{selectedLeave.leave_type}</p>
                        </div>
                        <div className="p-4 bg-base-50 border border-base-200 rounded-xl">
                           <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Duration</p>
                           <p className="font-bold">
                             {new Date(selectedLeave.start_date).toLocaleDateString()} - {new Date(selectedLeave.end_date).toLocaleDateString()}
                           </p>
                        </div>
                     </div>

                     <div className="p-5 bg-base-50 border border-base-200 rounded-xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Reason Provided</p>
                        <p className="text-sm font-medium leading-relaxed italic text-gray-700">"{selectedLeave.reason}"</p>
                     </div>

                     {selectedLeave.status === 'pending' ? (
                        <div className="grid grid-cols-2 gap-4 pt-4">
                           <button
                              onClick={() => rejectMutation.mutate(selectedLeave.id)}
                              disabled={rejectMutation.isPending}
                              className="btn btn-outline btn-error rounded-xl font-bold h-12"
                           >
                              Reject
                           </button>
                           <button
                              onClick={() => approveMutation.mutate(selectedLeave.id)}
                              disabled={approveMutation.isPending}
                              className="btn btn-success text-white rounded-xl font-bold h-12"
                           >
                              Approve
                           </button>
                        </div>
                     ) : (
                        <button onClick={() => setSelectedLeave(null)} className="btn btn-block bg-base-200 hover:bg-base-300 border-none rounded-xl font-bold">Close Record</button>
                     )}
                  </div>
               </div>
               <div className="modal-backdrop bg-black/60" onClick={() => setSelectedLeave(null)}></div>
            </div>
         )}
      </div>
   );
};

export default LeaveManagement;

