import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Clock, Plus, CheckCircle2, XCircle, Clock as ClockIcon, 
  CalendarCheck, CalendarRange, FileText, Upload,
  ChevronRight, MapPin, Activity, GraduationCap, DollarSign
} from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';

/**
 * CSC Form No. 6 Requirements Mapping
 */
const LEAVE_REQUIREMENTS = {
  vacation: "None for < 30 days. Travel Authority + Clearance required if abroad or 30+ days.",
  forced: "No documentary requirements.",
  sick: "Medical Certificate (if > 5 days or filed in advance). Affidavit if no medical consultation was availed.",
  maternity: "Proof of pregnancy (ultrasound, doctor's cert) + Notice of Allocation (CS Form 6a) if needed.",
  paternity: "Proof of child's delivery (Birth Cert, Medical Cert, and Marriage Contract).",
  special_privilege: "None for < 30 days. Travel Authority + Clearance required if abroad or 30+ days.",
  solo_parent: "Updated Solo Parent Identification Card.",
  study: "Contract between agency head and employee + internal agency requirements.",
  vawc: "BPO/TPO/PPO, or Police Report + Medical Certificate.",
  rehabilitation: "Letter request + Police Report + Medical Certificate + Written concurrence of govt physician.",
  women_special: "Medical Certificate with clinical summary, histopath report, and operative technique used.",
  emergency: "Declaration of calamity area by proper government agency.",
  adoption: "Authenticated copy of Pre-Adoptive Placement Authority (DSWD).",
  others: "Supporting documents related to the specified purpose.",
};

const formatStatus = (status) => {
  if (status === 'pending_supervisor') return 'Pending Supervisor';
  if (status === 'pending_hr') return 'Pending HR';
  if (status === 'pending_superintendent') return 'Pending Superintendent';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return status;
};

/**
 * My Leaves (Employee View) - CSC Form No. 6 Compliant
 */
const MyLeaves = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isWithinPhilippines, setIsWithinPhilippines] = useState(true);

  // Approvals & Role Capabilities States
  const [activeMainTab, setActiveMainTab] = useState('mine'); // 'mine', 'approvals'
  const [approvalTab, setApprovalTab] = useState('pending'); // 'pending', 'accepted', 'rejected'
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const calculateWorkingDays = (start, end) => {
    if (!start || !end) return 0;
    const sDate = new Date(start);
    const eDate = new Date(end);
    if (sDate > eDate) return 0;
    let count = 0;
    let current = new Date(sDate);
    while (current <= eDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Mon-Fri
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  const durationDays = calculateWorkingDays(startDate, endDate);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDateStr = `${yyyy}-${mm}-${dd}`;

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
  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`leaves/${id}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      setSelectedApproval(null);
    },
    onError: (err) => alert(err.response?.data?.detail || "Approval failed.")
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.post(`leaves/${id}/reject/`, { disapproval_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      setSelectedApproval(null);
      setRejectionReason('');
    },
    onError: (err) => alert(err.response?.data?.detail || "Rejection failed.")
  });

  const isSupervisorOrManager = ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'].includes(user?.role) || employee?.is_supervisor;

  const myLeaves = leaves.filter(l => l.employee === employee?.id);
  const teamLeaves = leaves.filter(l => l.employee !== employee?.id);

  const filteredTeamLeaves = teamLeaves.filter(l => {
    if (approvalTab === 'pending') return ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(l.status);
    if (approvalTab === 'accepted') return l.status === 'approved';
    if (approvalTab === 'rejected') return l.status === 'rejected';
    return true;
  });

  const pendingActionRequired = filteredTeamLeaves.filter(l => l.can_approve);
  const pendingInProgress = filteredTeamLeaves.filter(l => !l.can_approve);

  const renderLeaveCard = (leave) => {
    const isActionRequired = leave.can_approve && ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(leave.status);
    return (
      <div key={leave.id} className={`bg-white border shadow-sm hover:shadow-md transition-all rounded-xl overflow-hidden group flex flex-col justify-between ${isActionRequired ? 'border-primary/45 ring-1 ring-primary/10' : 'border-base-200'}`}>
         <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-lg bg-base-50 border border-base-200 flex items-center justify-center text-primary font-black uppercase text-xs">
                        {leave.employee_name?.charAt(0) || 'U'}
                     </div>
                     <div>
                        <p className="font-bold text-sm text-base-content leading-tight">{leave.employee_name}</p>
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-tighter">{leave.department || 'Personnel'}</p>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                           leave.status === 'approved' ? 'bg-success/10 text-success' :
                           leave.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                        }`}>
                        {formatStatus(leave.status)}
                     </div>
                     {isActionRequired && (
                        <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 px-1 py-0.5 rounded animate-pulse">
                           Action Required
                        </span>
                     )}
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
            </div>

            <button
               type="button"
               onClick={() => setSelectedApproval(leave)}
               className={`btn btn-ghost btn-block bg-base-50 border-base-200 hover:bg-primary/5 hover:text-primary hover:border-primary/20 rounded-lg text-xs font-bold uppercase tracking-widest group transition-all mt-4 ${isActionRequired ? 'bg-primary text-primary-content hover:bg-primary/95 hover:text-primary-content border-none' : ''}`}
            >
               {isActionRequired ? 'Review & Decide' : 'Review Details'}
               <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform ml-1" />
            </button>
         </div>
      </div>
    );
  };

  // 2. Mutations
  const applyMutation = useMutation({
    mutationFn: (formData) => api.post('leaves/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      queryClient.invalidateQueries({ queryKey: ['me'] }); 
      setIsModalOpen(false);
      alert('Leave application submitted successfully!');
    },
    onError: (err) => {
      const errorData = err.response?.data;
      let msg = 'Application failed. Please check requirements.';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          msg = errorData;
        } else if (errorData.detail) {
          msg = errorData.detail;
        } else if (typeof errorData === 'object') {
          // Flatten field errors: {"field": ["error"]} -> "field: error"
          msg = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors[0] : errors}`)
            .join('\n');
        }
      }
      alert(msg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    applyMutation.mutate(formData);
  };

  if (isLoading) return (
    <div className="p-8 flex justify-center h-[60vh] items-center text-primary">
      <span className="loading loading-spinner loading-lg"></span>
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
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">
              {activeMainTab === 'mine' ? 'My Leaves' : 'Leave Approvals'}
            </h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">
            {activeMainTab === 'mine' ? 'CSC Form No. 6 Compliant' : 'CSC Form No. 6 Review Portal'}
          </p>
        </div>
        
        {activeMainTab === 'mine' && (
          <button 
            type="button"
            onClick={() => {
              setLeaveType('vacation');
              setStartDate('');
              setEndDate('');
              setIsWithinPhilippines(true);
              setIsModalOpen(true);
            }} 
            className="btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-8"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </button>
        )}
      </div>

      {/* Main Tab Toggle for Supervisors/Managers */}
      {isSupervisorOrManager && (
         <div className="flex gap-4 border-b border-base-200">
            <button 
              type="button"
              onClick={() => setActiveMainTab('mine')}
              className={`pb-2 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                activeMainTab === 'mine' ? 'border-primary text-primary' : 'border-transparent opacity-40 hover:opacity-100'
              }`}
            >
              My Applications
            </button>
            <button 
              type="button"
              onClick={() => setActiveMainTab('approvals')}
              className={`pb-2 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                activeMainTab === 'approvals' ? 'border-primary text-primary' : 'border-transparent opacity-40 hover:opacity-100'
              }`}
            >
              Team Approvals ({teamLeaves.filter(l => ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(l.status)).length} Pending)
            </button>
         </div>
      )}

      {/* 1. MY APPLICATIONS VIEW */}
      {activeMainTab === 'mine' && (
         <>
            {/* Credit Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
              <div className="bg-white border border-base-200 p-8 rounded-xl flex items-center justify-between shadow-sm group">
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-2">Vacation Credits</p>
                  <h2 className="text-5xl font-black text-primary flex items-baseline gap-2">
                    {employee?.vacation_leave_balance || 0}
                    <span className="text-[10px] opacity-30 tracking-widest uppercase">Days</span>
                  </h2>
                </div>
                <CalendarCheck className="w-12 h-12 text-primary/10 group-hover:text-primary/20 transition-colors" />
              </div>

              <div className="bg-white border border-base-200 p-8 rounded-xl flex items-center justify-between shadow-sm group">
                <div>
                  <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] mb-2">Sick Credits</p>
                  <h2 className="text-5xl font-black text-secondary flex items-baseline gap-2">
                    {employee?.sick_leave_balance || 0}
                    <span className="text-[10px] opacity-30 tracking-widest uppercase">Days</span>
                  </h2>
                </div>
                <Clock className="w-12 h-12 text-secondary/10 group-hover:text-secondary/20 transition-colors" />
              </div>
            </div>

            {/* History Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <ClockIcon className="w-4 h-4 text-primary opacity-40" />
                <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40">Application History</h2>
              </div>
              
              {myLeaves.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myLeaves.map((leave) => (
                    <div key={leave.id} className="bg-white border border-base-200 shadow-sm hover:shadow-md transition-all rounded-xl p-6 space-y-4 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div className="px-2 py-0.5 rounded-lg font-black uppercase text-[9px] tracking-widest bg-base-50 text-base-content/50 border border-base-100">
                          {leave.leave_type.replace('_', ' ')}
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            leave.status === 'approved' ? 'bg-success/10 text-success' :
                            leave.status === 'rejected' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                          }`}>
                          {formatStatus(leave.status)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-bold text-base-content">
                          {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] font-black opacity-30 uppercase tracking-tight italic">Filed: {new Date(leave.date_applied).toLocaleDateString()}</p>
                      </div>

                      <div className="flex-1 space-y-2">
                        {(leave.location_details || leave.illness_details || leave.other_type_details) && (
                          <div className="bg-base-50/50 p-3 rounded-lg border border-base-100/50">
                            <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter mb-1 flex items-center gap-1.5">
                              <FileText className="w-2.5 h-2.5" />
                              Details
                            </p>
                            <p className="text-[10px] font-medium leading-relaxed italic opacity-80">
                              {leave.location_details || leave.illness_details || leave.other_type_details}
                            </p>
                          </div>
                        )}

                        {leave.status === 'rejected' && leave.disapproval_reason && (
                          <div className="bg-error/5 p-3 rounded-lg border border-error/10">
                            <p className="text-[10px] font-black text-error uppercase tracking-tighter mb-1">Reason for Rejection</p>
                            <p className="text-[10px] font-medium text-error/70 leading-relaxed italic font-serif">"{leave.disapproval_reason}"</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-base-50">
                        <div className="flex items-center gap-1.5 text-[10px] font-black opacity-40 uppercase">
                          <CalendarCheck className="w-3 h-3 text-primary" />
                          {leave.working_days_applied} Work Days
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {leave.supporting_document && (
                            <a 
                              href={leave.supporting_document} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="px-2 py-1 bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 rounded font-black text-[8px] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              View Doc
                            </a>
                          )}
                          {leave.travel_authority_document && (
                            <a 
                              href={leave.travel_authority_document} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="px-2 py-1 bg-secondary/5 text-secondary border border-secondary/10 hover:bg-secondary/10 rounded font-black text-[8px] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              Travel Auth
                            </a>
                          )}
                          {leave.clearance_document && (
                            <a 
                              href={leave.clearance_document} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="px-2 py-1 bg-accent/5 text-accent border border-accent/10 hover:bg-accent/10 rounded font-black text-[8px] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              Clearance
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center opacity-30 italic font-black uppercase tracking-widest bg-white rounded-xl border border-dashed border-base-300">
                   No applications found
                </div>
              )}
            </div>
         </>
      )}

      {/* 2. TEAM APPROVALS VIEW */}
      {activeMainTab === 'approvals' && (
         <div className="space-y-6">
            {/* Simple Sub-Tabs */}
            <div className="flex gap-2 bg-base-200/50 p-1 rounded-xl w-fit border border-base-200">
               <button
                  type="button"
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${approvalTab === 'pending' ? 'bg-white text-primary shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                  onClick={() => setApprovalTab('pending')}
               >
                  Pending 
                  <span className="bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">
                     {teamLeaves.filter(l => ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(l.status)).length}
                  </span>
               </button>
               <button
                  type="button"
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${approvalTab === 'accepted' ? 'bg-white text-success shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                  onClick={() => setApprovalTab('accepted')}
               >
                  Approved
                  <span className="bg-success/10 px-1.5 py-0.5 rounded text-[10px]">
                     {teamLeaves.filter(l => l.status === 'approved').length}
                  </span>
               </button>
               <button
                  type="button"
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${approvalTab === 'rejected' ? 'bg-white text-error shadow-sm' : 'opacity-40 hover:opacity-100'}`}
                  onClick={() => setApprovalTab('rejected')}
               >
                  Rejected
                  <span className="bg-error/10 px-1.5 py-0.5 rounded text-[10px]">
                     {teamLeaves.filter(l => l.status === 'rejected').length}
                  </span>
               </button>
            </div>

            {/* Leave Grid / Separated lists */}
            {approvalTab === 'pending' ? (
               <div className="space-y-8">
                  {/* Action Required Section */}
                  <div className="space-y-4">
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2 px-1">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Action Required ({pendingActionRequired.length})
                     </h3>
                     {pendingActionRequired.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {pendingActionRequired.map((leave) => renderLeaveCard(leave))}
                        </div>
                     ) : (
                        <div className="py-12 bg-white rounded-xl border border-dashed border-base-200 flex flex-col items-center justify-center text-center opacity-40 shadow-sm">
                           <CheckCircle2 className="w-8 h-8 text-success mb-2" />
                           <p className="text-[11px] font-black uppercase tracking-widest text-success">All Caught Up!</p>
                           <p className="text-[10px] font-medium opacity-60">No pending leave requests require your decision right now.</p>
                        </div>
                     )}
                  </div>

                  {/* In Progress Section (Pending Others) */}
                  {pendingInProgress.length > 0 && (
                     <div className="space-y-4 pt-4 border-t border-base-100">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-50 flex items-center gap-2 px-1">
                           <ClockIcon className="w-4 h-4 text-warning" />
                           In Progress / Pending Others ({pendingInProgress.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {pendingInProgress.map((leave) => renderLeaveCard(leave))}
                        </div>
                     </div>
                  )}
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTeamLeaves.length > 0 ? (
                     filteredTeamLeaves.map((leave) => renderLeaveCard(leave))
                  ) : (
                     <div className="col-span-full py-24 bg-white rounded-xl border border-dashed border-base-300 flex flex-col items-center justify-center text-center opacity-30">
                        <CalendarRange className="w-12 h-12 mb-3" />
                        <p className="text-sm font-black uppercase tracking-widest">No {approvalTab} leaves</p>
                     </div>
                  )}
               </div>
            )}
         </div>
      )}

      {/* Decision Modal */}
      {selectedApproval && (
         <div className="modal modal-open">
            <div className="modal-box rounded-xl max-w-4xl p-0 overflow-hidden shadow-2xl border border-base-300 bg-white h-[90vh] flex flex-col">
               <div className="bg-base-50/50 border-b border-base-200 p-6 flex items-center justify-between shrink-0">
                 <div>
                    <h3 className="font-black text-lg text-base-content uppercase tracking-tight">{selectedApproval.employee_name}</h3>
                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">{selectedApproval.department || 'Personnel'}</p>
                 </div>
                 <button type="button" onClick={() => setSelectedApproval(null)} className="btn btn-ghost btn-sm btn-circle"><XCircle className="w-5 h-5 opacity-40" /></button>
               </div>

               <div className="p-8 space-y-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="p-4 bg-base-50 border border-base-200 rounded-lg">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Leave Type</p>
                        <p className="font-black text-xs text-primary uppercase">{selectedApproval.leave_type.replace('_', ' ')}</p>
                     </div>
                     <div className="p-4 bg-base-50 border border-base-200 rounded-lg">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Dates Requested</p>
                        <p className="font-bold text-[10px]">
                          {new Date(selectedApproval.start_date).toLocaleDateString()} - {new Date(selectedApproval.end_date).toLocaleDateString()}
                        </p>
                     </div>
                     <div className="p-4 bg-base-50 border border-base-200 rounded-lg">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Days</p>
                        <p className="font-black text-xs">{selectedApproval.working_days_applied} Work Day(s)</p>
                     </div>
                  </div>

                  <div className="space-y-3 p-6 bg-primary/5 rounded-xl border border-primary/10">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Leave Balances</h4>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="text-center p-3 bg-white border border-primary/20 rounded-lg">
                           <p className="text-[10px] font-black opacity-40 uppercase mb-1">Vacation Balance</p>
                           <p className="text-2xl font-black text-primary">{selectedApproval.vacation_balance || 0}</p>
                        </div>
                        <div className="text-center p-3 bg-white border border-primary/20 rounded-lg">
                           <p className="text-[10px] font-black opacity-40 uppercase mb-1">Sick Balance</p>
                           <p className="text-2xl font-black text-secondary">{selectedApproval.sick_balance || 0}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 px-1">Application Details</h4>
                     
                     {selectedApproval.location_details && (
                        <div className="flex items-start gap-4 p-4 bg-base-50 border border-base-200 rounded-lg">
                           <MapPin className="w-4 h-4 text-primary opacity-40 mt-1" />
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Where will the staff be?</p>
                              <p className="text-xs font-bold">{selectedApproval.is_within_philippines ? 'WITHIN PHILIPPINES' : 'ABROAD'}: {selectedApproval.location_details}</p>
                           </div>
                        </div>
                     )}

                     {selectedApproval.illness_details && (
                        <div className="flex items-start gap-4 p-4 bg-base-50 border border-base-200 rounded-lg">
                           <Activity className="w-4 h-4 text-secondary opacity-40 mt-1" />
                           <div>
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Medical Details</p>
                              <p className="text-xs font-bold uppercase">{selectedApproval.is_in_hospital ? 'IN HOSPITAL' : 'OUT PATIENT'}: {selectedApproval.illness_details}</p>
                           </div>
                        </div>
                     )}

                     {selectedApproval.supporting_document && (
                        <div className="group relative p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
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
                              href={selectedApproval.supporting_document} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-sm btn-primary rounded-lg font-black text-[9px] uppercase tracking-widest px-6"
                           >
                              Open Document
                           </a>
                        </div>
                     )}

                     {selectedApproval.travel_authority_document && (
                        <div className="group relative p-4 bg-secondary/5 border border-secondary/20 rounded-xl flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-secondary shadow-sm border border-secondary/10">
                                 <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Travel Authority</p>
                                 <p className="text-[9px] font-bold opacity-40 uppercase">Required for Travel Abroad / 30+ Days</p>
                              </div>
                           </div>
                           <a 
                              href={selectedApproval.travel_authority_document} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-sm btn-secondary rounded-lg font-black text-[9px] uppercase tracking-widest px-6"
                           >
                              Open Document
                           </a>
                        </div>
                     )}

                     {selectedApproval.clearance_document && (
                        <div className="group relative p-4 bg-accent/5 border border-accent/20 rounded-xl flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-accent shadow-sm border border-accent/10">
                                 <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black text-accent uppercase tracking-widest">Clearance Document</p>
                                 <p className="text-[9px] font-bold opacity-40 uppercase">Required for Travel Abroad / 30+ Days</p>
                              </div>
                           </div>
                           <a 
                              href={selectedApproval.clearance_document} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-sm btn-accent rounded-lg font-black text-[9px] uppercase tracking-widest px-6"
                           >
                              Open Document
                           </a>
                        </div>
                     )}
                  </div>

                  {['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(selectedApproval.status) && (
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
                        
                        {selectedApproval.can_approve ? (
                           <div className="grid grid-cols-2 gap-4">
                              <button
                                 type="button"
                                 onClick={() => rejectMutation.mutate({ id: selectedApproval.id, reason: rejectionReason })}
                                 disabled={rejectMutation.isPending}
                                 className="btn btn-outline border-base-300 text-error hover:bg-error/5 hover:border-error/20 rounded-lg font-black text-[11px] uppercase tracking-widest h-12"
                              >
                                 Reject Application
                              </button>
                              <button
                                 type="button"
                                 onClick={() => approveMutation.mutate(selectedApproval.id)}
                                 disabled={approveMutation.isPending}
                                 className="btn btn-primary rounded-lg font-black text-[11px] uppercase tracking-widest h-12 shadow-md shadow-primary/20"
                              >
                                 {selectedApproval.status === 'pending_supervisor' ? 'Recommend Approval' :
                                  selectedApproval.status === 'pending_hr' ? 'Verify & Recommend' : 'Final Approve & Deduct'}
                              </button>
                           </div>
                        ) : (
                           <div className="p-4 bg-base-100 rounded-lg text-center text-xs font-bold opacity-40 italic">
                              Read-only view for your role. Current stage: {formatStatus(selectedApproval.status)}
                           </div>
                        )}
                     </div>
                  )}

                  {!['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(selectedApproval.status) && (
                     <div className="pt-6 border-t border-base-100 space-y-4">
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${selectedApproval.status === 'approved' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                           {selectedApproval.status === 'approved' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                           <span className="text-xs font-black uppercase tracking-widest">Request {formatStatus(selectedApproval.status)}</span>
                        </div>
                        {selectedApproval.disapproval_reason && (
                           <div className="p-4 bg-base-50 border border-base-200 rounded-lg">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Reason for Action</p>
                              <p className="text-xs font-medium italic opacity-60">"{selectedApproval.disapproval_reason}"</p>
                           </div>
                        )}
                        <button type="button" onClick={() => setSelectedApproval(null)} className="btn btn-block bg-base-100 border-base-200 rounded-lg font-black text-xs uppercase tracking-widest h-12">Close Record</button>
                     </div>
                  )}
               </div>
            </div>
            <div className="modal-backdrop bg-black/40" onClick={() => setSelectedApproval(null)}></div>
         </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl p-0 overflow-hidden border border-base-100 max-w-4xl shadow-2xl bg-white h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-base-200 p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <CalendarRange className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-base-content uppercase tracking-tight">Application for Leave</h3>
                  <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-0.5">CSC Form No. 6 (Revised 2020)</p>
                </div>
              </div>
              <button 
                className="btn btn-ghost btn-sm btn-circle hover:bg-error/10 hover:text-error transition-colors" 
                onClick={() => setIsModalOpen(false)}
              >
                <XCircle className="w-5 h-5 opacity-60" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 bg-base-50/20">
              {/* Type of Leave Section */}
              <div className="space-y-4 p-6 bg-white rounded-2xl border border-base-200 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 border-b border-base-100 pb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black">1</span>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-base-content/70">6.A Type of Leave to be Availed Of</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Select Leave Type</label>
                    <select 
                      name="leave_type" 
                      className="select select-bordered select-sm w-full bg-base-50 border-base-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg text-xs font-bold transition-all" 
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      required
                    >
                      <option value="vacation">Vacation Leave</option>
                      <option value="forced">Mandatory/Forced Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="special_privilege">Special Privilege Leave</option>
                      <option value="solo_parent">Solo Parent Leave</option>
                      <option value="study">Study Leave</option>
                      <option value="vawc">10-Day VAWC Leave</option>
                      <option value="rehabilitation">Rehabilitation Privilege</option>
                      <option value="women_special">Special Leave Benefits for Women</option>
                      <option value="emergency">Special Emergency Leave</option>
                      <option value="adoption">Adoption Leave</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  {leaveType === 'others' && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Specify Other Type</label>
                      <input 
                        name="other_type_details" 
                        type="text" 
                        placeholder="e.g. Bereavement Leave" 
                        className="input input-bordered input-sm w-full bg-base-50 border-base-200 rounded-lg text-xs font-bold focus:border-primary" 
                        required 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Details of Leave Section */}
              <div className="space-y-4 p-6 bg-white rounded-2xl border border-base-200 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 border-b border-base-100 pb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black">2</span>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-base-content/70">6.B Details of Leave</h4>
                </div>
                
                {['vacation', 'special_privilege'].includes(leaveType) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Location Details</label>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Within PH Option Card */}
                        <div 
                          onClick={() => setIsWithinPhilippines(true)}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all hover:bg-base-50 ${isWithinPhilippines === true ? 'border-primary bg-primary/5 text-primary' : 'border-base-200 text-base-content/60'}`}
                        >
                          <input 
                            type="radio" 
                            name="is_within_philippines" 
                            value="true" 
                            className="radio radio-primary radio-xs" 
                            checked={isWithinPhilippines === true} 
                            onChange={() => setIsWithinPhilippines(true)} 
                          />
                          <span className="text-[10px] font-black uppercase tracking-tight">Within PH</span>
                        </div>
                        {/* Abroad Option Card */}
                        <div 
                          onClick={() => setIsWithinPhilippines(false)}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all hover:bg-base-50 ${isWithinPhilippines === false ? 'border-primary bg-primary/5 text-primary' : 'border-base-200 text-base-content/60'}`}
                        >
                          <input 
                            type="radio" 
                            name="is_within_philippines" 
                            value="false" 
                            className="radio radio-primary radio-xs" 
                            checked={isWithinPhilippines === false} 
                            onChange={() => setIsWithinPhilippines(false)} 
                          />
                          <span className="text-[10px] font-black uppercase tracking-tight">Abroad</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Specify Location details</label>
                      <input 
                        name="location_details" 
                        type="text" 
                        className="input input-bordered input-sm w-full bg-base-50 border-base-200 rounded-lg text-xs font-bold focus:border-primary" 
                        placeholder="e.g. Manila, or Tokyo (Japan)" 
                      />
                    </div>
                  </div>
                )}

                {['sick', 'women_special', 'rehabilitation'].includes(leaveType) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Treatment Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer hover:bg-base-50 border-base-200 text-base-content/60">
                          <input type="radio" name="is_in_hospital" value="true" className="radio radio-primary radio-xs" />
                          <span className="text-[10px] font-black uppercase tracking-tight">In-Hospital</span>
                        </label>
                        <label className="flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer hover:bg-base-50 border-base-200 text-base-content/60">
                          <input type="radio" name="is_in_hospital" value="false" className="radio radio-primary radio-xs" defaultChecked />
                          <span className="text-[10px] font-black uppercase tracking-tight">Out-Patient</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Specify Illness / Diagnosis</label>
                      <input 
                        name="illness_details" 
                        type="text" 
                        className="input input-bordered input-sm w-full bg-base-50 border-base-200 rounded-lg text-xs font-bold focus:border-primary" 
                        placeholder="Diagnosis/Illness" 
                        required 
                      />
                    </div>
                  </div>
                )}

                {leaveType === 'study' && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Purpose of Study</label>
                    <select name="study_type" className="select select-bordered select-sm w-full bg-base-50 border-base-200 rounded-lg text-xs font-bold focus:border-primary" required>
                      <option value="masters">Completion of Master's Degree</option>
                      <option value="board_exam">BAR/Board Examination Review</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Working Days & Commutation Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dates Applied Card */}
                <div className="space-y-4 p-6 bg-white rounded-2xl border border-base-200 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center justify-between border-b border-base-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black">3</span>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-base-content/70">6.C Dates Applied</h4>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Start Date</label>
                      <input 
                        name="start_date" 
                        type="date" 
                        className="input input-bordered input-sm w-full bg-base-50 border-base-200 rounded-lg text-xs font-bold focus:border-primary" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={minDateStr}
                        required 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">End Date</label>
                      <input 
                        name="end_date" 
                        type="date" 
                        className="input input-bordered input-sm w-full bg-base-50 border-base-200 rounded-lg text-xs font-bold focus:border-primary" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={minDateStr}
                        required 
                      />
                    </div>
                  </div>
                  {durationDays > 0 && (
                    <div className="flex items-center gap-2 text-success bg-success/5 border border-success/10 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {durationDays} Working Days calculated
                    </div>
                  )}
                </div>

                {/* Commutation Card */}
                <div className="space-y-4 p-6 bg-white rounded-2xl border border-base-200 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 border-b border-base-100 pb-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black">4</span>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-base-content/70">6.D Commutation</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3 h-[60px] items-center">
                    <label className="flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer hover:bg-base-50 border-base-200 text-base-content/60">
                      <input type="radio" name="commutation" value="not_requested" className="radio radio-primary radio-xs" defaultChecked />
                      <span className="text-[10px] font-black uppercase tracking-tight">Not Requested</span>
                    </label>
                    <label className="flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer hover:bg-base-50 border-base-200 text-base-content/60">
                      <input type="radio" name="commutation" value="requested" className="radio radio-primary radio-xs" />
                      <span className="text-[10px] font-black uppercase tracking-tight">Requested</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Documentary Requirement */}
              {(() => {
                const isVacationOrSpecial = ['vacation', 'special_privilege'].includes(leaveType);
                if (isVacationOrSpecial) {
                  const needsDocs = !isWithinPhilippines || durationDays >= 30;
                  if (!needsDocs) {
                    return (
                      <div className="space-y-2 p-6 bg-base-50 rounded-xl border border-base-200 text-center">
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Documentary Requirements</h4>
                        <p className="text-[10px] font-bold text-base-content/60 italic mt-2">
                          None required for vacation leave of less than 30 days within the Philippines.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 p-6 bg-primary/5 rounded-xl border border-primary/10 transition-all">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Documentary Requirements</h4>
                         <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase">Travel Authority + Clearance Required</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg border border-primary/5">
                         <p className="text-[10px] text-primary/80 font-bold leading-relaxed italic">
                            A leave request for abroad travel or duration of 30+ days requires uploading a Travel Authority and Clearance.
                         </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Travel Authority Upload */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Travel Authority Document</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="travel_authority_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Travel Authority</span>
                            </div>
                          </div>
                        </div>

                        {/* Clearance Upload */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Clearance Document</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="clearance_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Clearance</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Maternity Leave
                if (leaveType === 'maternity') {
                  return (
                    <div className="space-y-4 p-6 bg-primary/5 rounded-xl border border-primary/10 transition-all">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Documentary Requirements</h4>
                         <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase">Maternity Leave Docs</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg border border-primary/5">
                         <p className="text-[10px] text-primary/80 font-bold leading-relaxed italic">
                            Maternity leave requires a proof of pregnancy (ultrasound/doctor's certificate) and optional Notice of Allocation (CS Form 6a) if allocating days.
                         </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Proof of Pregnancy (Ultrasound/Cert)</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="supporting_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Proof</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Notice of Allocation (CS Form 6a - Optional)</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="maternity_notice_allocation" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload CS Form 6a</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Paternity Leave
                if (leaveType === 'paternity') {
                  return (
                    <div className="space-y-4 p-6 bg-primary/5 rounded-xl border border-primary/10 transition-all">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Documentary Requirements</h4>
                         <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase">Paternity Leave Docs</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg border border-primary/5">
                         <p className="text-[10px] text-primary/80 font-bold leading-relaxed italic">
                            Paternity leave requires proof of child's delivery and a copy of your marriage contract.
                         </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Proof of Delivery (Birth Cert / Medical Cert)</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="supporting_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Proof</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Marriage Contract</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="paternity_marriage_contract" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Marriage Contract</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // VAWC Leave
                if (leaveType === 'vawc') {
                  return (
                    <div className="space-y-4 p-6 bg-primary/5 rounded-xl border border-primary/10 transition-all">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Documentary Requirements</h4>
                         <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase">VAWC Leave Docs</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg border border-primary/5">
                         <p className="text-[10px] text-primary/80 font-bold leading-relaxed italic">
                            VAWC leave requires a Barangay/Temporary/Permanent Protection Order (BPO/TPO/PPO) or Police Report, plus a Medical Certificate.
                         </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">BPO/TPO/PPO or Police Report</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="supporting_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Protection Order</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Medical Certificate</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="vawc_medical_cert" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Med Cert</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Rehabilitation Privilege
                if (leaveType === 'rehabilitation') {
                  return (
                    <div className="space-y-4 p-6 bg-primary/5 rounded-xl border border-primary/10 transition-all">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Documentary Requirements</h4>
                         <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase">Rehab Privilege Docs</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg border border-primary/5">
                         <p className="text-[10px] text-primary/80 font-bold leading-relaxed italic">
                            Rehabilitation Privilege requires a Letter Request, Police Report, Medical Certificate, and Written Concurrence of a Govt Physician.
                         </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Medical Certificate</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="supporting_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Med Cert</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Letter Request</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="rehab_letter_request" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Letter</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Police Report</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="rehab_police_report" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Police Report</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Concurrence of Govt Physician</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="rehab_concurrence" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Concurrence</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Women Special Leave Benefits
                if (leaveType === 'women_special') {
                  return (
                    <div className="space-y-4 p-6 bg-primary/5 rounded-xl border border-primary/10 transition-all">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Documentary Requirements</h4>
                         <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase">Special Leave Benefits for Women Docs</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg border border-primary/5">
                         <p className="text-[10px] text-primary/80 font-bold leading-relaxed italic">
                            Requires a Medical Certificate / Clinical Summary, Histopathology Report, and Operative Technique.
                         </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Medical Certificate / Summary</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="supporting_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Med Cert</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Histopathology Report</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="women_special_histopath" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Histopath</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase opacity-40 ml-1">Operative Technique</label>
                          <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                            <input type="file" name="women_special_operative_technique" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Technique</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default behavior for other leave types
                if (LEAVE_REQUIREMENTS[leaveType] !== "No documentary requirements.") {
                  return (
                    <div className="space-y-2 p-6 bg-primary/5 rounded-xl border border-primary/10 transition-all">
                      <div className="flex items-center justify-between">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Documentary Requirements</h4>
                         <div className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] font-black uppercase">Required per PDF</div>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg border border-primary/5">
                         <p className="text-[10px] text-primary/80 font-bold leading-relaxed italic">
                            {LEAVE_REQUIREMENTS[leaveType] || "Please check CSR rules for requirements."}
                         </p>
                      </div>
                      <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors mt-2">
                        <input type="file" name="supporting_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload PDF / Image</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Action Buttons */}
              <div className="pt-6 border-t border-base-100 flex gap-4 shrink-0">
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
                  {applyMutation.isPending ? 'Processing...' : 'Submit Application'}
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
