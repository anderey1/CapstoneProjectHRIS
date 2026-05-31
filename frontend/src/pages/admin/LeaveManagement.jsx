import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, CheckCircle2, XCircle, Clock as ClockIcon, ChevronRight, FileText, CalendarRange, MapPin, Activity, GraduationCap, DollarSign } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';

/**
 * Leaves Management (Admin/HR View) - CSC Form No. 6 Compliant
 */
const LeaveManagement = () => {
   const { user } = useAuth();
   const queryClient = useQueryClient();
   const [activeTab, setActiveTab] = useState('pending');
   const [selectedLeave, setSelectedLeave] = useState(null);
   const [rejectionReason, setRejectionReason] = useState('');

   const canManage = user?.role === 'ADMIN' || user?.role === 'HR';

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
      mutationFn: ({ id, reason }) => api.post(`leaves/${id}/reject/`, { disapproval_reason: reason }),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
         setSelectedLeave(null);
         setRejectionReason('');
      },
      onError: (err) => alert(err.response?.data?.detail || "Rejection failed.")
   });

   const filteredLeaves = leaves.filter(l => activeTab === 'pending' ? l.status === 'pending' : l.status !== 'pending');

   if (isLoading) return (
      <div className="p-8 flex justify-center h-[60vh] items-center text-primary">
         <span className="loading loading-spinner loading-lg"></span>
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
                  <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">Leave Requests</h1>
               </div>
               <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">CSC Form No. 6 Review Portal</p>
            </div>
         </div>

         {/* Simple Tabs */}
         <div className="flex gap-2 bg-base-200/50 p-1 rounded-xl w-fit border border-base-200">
            <button
               className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-white text-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}
               onClick={() => setActiveTab('pending')}
            >
               Pending ({leaves.filter(l => l.status === 'pending').length})
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
                                 <p className="text-[10px] font-black opacity-30 uppercase tracking-tighter">{leave.department || 'Personnel'}</p>
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
                              <span className="text-[11px] font-bold text-base-content uppercase tracking-tight">{leave.leave_type.replace('_', ' ')} Leave</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <ClockIcon className="w-3.5 h-3.5 opacity-30" />
                                 <span className="text-[11px] font-medium opacity-60">
                                    {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                 </span>
                              </div>
                              <span className="text-[10px] font-black text-primary px-2 py-1 bg-primary/5 rounded border border-primary/10 uppercase">
                                 {leave.working_days_applied} Days
                              </span>
                           </div>
                        </div>

                        <button
                           onClick={() => setSelectedLeave(leave)}
                           className="btn btn-ghost btn-block bg-base-50 border-base-200 hover:bg-primary/5 hover:text-primary hover:border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest group transition-all"
                        >
                           Review Requirements
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
               <div className="modal-box rounded-xl max-w-4xl p-0 overflow-hidden shadow-2xl border border-base-300 bg-white h-[90vh] flex flex-col">
                  <div className="bg-base-50/50 border-b border-base-200 p-6 flex items-center justify-between shrink-0">
                    <div>
                       <h3 className="font-black text-lg text-base-content uppercase tracking-tight">{selectedLeave.employee_name}</h3>
                       <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">{selectedLeave.department || 'Personnel'}</p>
                    </div>
                    <button onClick={() => setSelectedLeave(null)} className="btn btn-ghost btn-sm btn-circle"><XCircle className="w-5 h-5 opacity-40" /></button>
                  </div>

                  <div className="p-8 space-y-6 overflow-y-auto flex-1">
                     {/* Application Header Info */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-base-50 border border-base-200 rounded-lg">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Leave Type</p>
                           <p className="font-black text-xs text-primary uppercase">{selectedLeave.leave_type.replace('_', ' ')}</p>
                        </div>
                        <div className="p-4 bg-base-50 border border-base-200 rounded-lg">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Inclusive Dates</p>
                           <p className="font-bold text-[10px]">
                             {new Date(selectedLeave.start_date).toLocaleDateString()} - {new Date(selectedLeave.end_date).toLocaleDateString()}
                           </p>
                        </div>
                        <div className="p-4 bg-base-50 border border-base-200 rounded-lg">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Applied Days</p>
                           <p className="font-black text-xs">{selectedLeave.working_days_applied} Work Day(s)</p>
                        </div>
                     </div>

                     {/* Credit Certification (Section 7.A) */}
                     <div className="space-y-3 p-6 bg-primary/5 rounded-xl border border-primary/10">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Section 7.A: Current Leave Credits</h4>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="text-center p-3 bg-white border border-primary/20 rounded-lg">
                              <p className="text-[10px] font-black opacity-40 uppercase mb-1">Vacation Balance</p>
                              <p className="text-2xl font-black text-primary">{selectedLeave.vacation_balance || 0}</p>
                           </div>
                           <div className="text-center p-3 bg-white border border-primary/20 rounded-lg">
                              <p className="text-[10px] font-black opacity-40 uppercase mb-1">Sick Balance</p>
                              <p className="text-2xl font-black text-secondary">{selectedLeave.sick_balance || 0}</p>
                           </div>
                        </div>
                     </div>

                     {/* Details (Section 6.B) */}
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">Section 6.B: Details of Application</h4>
                        
                        {selectedLeave.location_details && (
                           <div className="flex items-start gap-4 p-4 bg-base-50 border border-base-200 rounded-lg">
                              <MapPin className="w-4 h-4 text-primary opacity-40 mt-1" />
                              <div>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Location Details</p>
                                 <p className="text-xs font-bold">{selectedLeave.is_within_philippines ? 'WITHIN PHILIPPINES' : 'ABROAD'}: {selectedLeave.location_details}</p>
                              </div>
                           </div>
                        )}

                        {selectedLeave.illness_details && (
                           <div className="flex items-start gap-4 p-4 bg-base-50 border border-base-200 rounded-lg">
                              <Activity className="w-4 h-4 text-secondary opacity-40 mt-1" />
                              <div>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Clinical Details</p>
                                 <p className="text-xs font-bold uppercase">{selectedLeave.is_in_hospital ? 'IN HOSPITAL' : 'OUT PATIENT'}: {selectedLeave.illness_details}</p>
                              </div>
                           </div>
                        )}

                        {selectedLeave.study_type && (
                           <div className="flex items-start gap-4 p-4 bg-base-50 border border-base-200 rounded-lg">
                              <GraduationCap className="w-4 h-4 text-primary opacity-40 mt-1" />
                              <div>
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Study Purpose</p>
                                 <p className="text-xs font-bold uppercase">{selectedLeave.study_type.replace('_', ' ')}</p>
                              </div>
                           </div>
                        )}

                        <div className="flex items-start gap-4 p-4 bg-base-50 border border-base-200 rounded-lg">
                           <DollarSign className="w-4 h-4 text-success opacity-40 mt-1" />
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Commutation</p>
                              <p className="text-xs font-bold uppercase">{selectedLeave.commutation.replace('_', ' ')}</p>
                           </div>
                        </div>

                        {selectedLeave.supporting_document && (
                           <div className="group relative p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between transition-all hover:bg-primary/10">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm border border-primary/10">
                                    <FileText className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Supporting Attachment</p>
                                    <p className="text-[9px] font-bold opacity-40 uppercase">CSC Form 6 Requirement</p>
                                 </div>
                              </div>
                              <a 
                                 href={selectedLeave.supporting_document} 
                                 target="_blank" 
                                 rel="noreferrer" 
                                 className="btn btn-sm btn-primary rounded-lg font-black text-[9px] uppercase tracking-widest px-6"
                              >
                                 Open Document
                              </a>
                           </div>
                        )}
                     </div>

                     {selectedLeave.status === 'pending' && (
                        <div className="space-y-4 pt-6 border-t border-base-100">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Disapproval Reason (Optional)</label>
                              <textarea 
                                 className="textarea textarea-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-medium" 
                                 placeholder="Provide reason if rejecting..."
                                 value={rejectionReason}
                                 onChange={(e) => setRejectionReason(e.target.value)}
                              ></textarea>
                           </div>
                           
                           {canManage ? (
                              <div className="grid grid-cols-2 gap-4">
                                 <button
                                    onClick={() => rejectMutation.mutate({ id: selectedLeave.id, reason: rejectionReason })}
                                    disabled={rejectMutation.isPending}
                                    className="btn btn-outline border-base-300 text-error hover:bg-error/5 hover:border-error/20 rounded-lg font-black text-[11px] uppercase tracking-widest h-12"
                                 >
                                    Reject Application
                                 </button>
                                 <button
                                    onClick={() => approveMutation.mutate(selectedLeave.id)}
                                    disabled={approveMutation.isPending}
                                    className="btn btn-primary rounded-lg font-black text-[11px] uppercase tracking-widest h-12 shadow-md shadow-primary/20"
                                 >
                                    Approve for CSC
                                 </button>
                              </div>
                           ) : (
                              <div className="p-4 bg-base-100 rounded-lg text-center text-xs font-bold opacity-40 italic">
                                 Read-only view for your role.
                              </div>
                           )}
                        </div>
                     )}

                     {selectedLeave.status !== 'pending' && (
                        <div className="pt-6 border-t border-base-100 space-y-4">
                           <div className={`p-4 rounded-lg flex items-center gap-3 ${selectedLeave.status === 'approved' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                              {selectedLeave.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                              <span className="text-xs font-black uppercase tracking-widest">Request {selectedLeave.status}</span>
                           </div>
                           {selectedLeave.disapproval_reason && (
                              <div className="p-4 bg-base-50 border border-base-200 rounded-lg">
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Reason for Action</p>
                                 <p className="text-xs font-medium italic opacity-60">"{selectedLeave.disapproval_reason}"</p>
                              </div>
                           )}
                           <button onClick={() => setSelectedLeave(null)} className="btn btn-block bg-base-100 border-base-200 rounded-lg font-black text-xs uppercase tracking-widest h-12">Close Record</button>
                        </div>
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
