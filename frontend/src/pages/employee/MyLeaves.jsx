import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CalendarRange } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';
import { useAuth } from '../../context/AuthContext';

// Modular Subcomponents
import LeaveBalanceCards from './leaves/LeaveBalanceCards';
import LeaveHistorySection from './leaves/LeaveHistorySection';
import SupervisorApprovalQueue from './leaves/SupervisorApprovalQueue';
import LeaveApplicationModal from './leaves/LeaveApplicationModal';

/**
 * MyLeaves (Employee View) - CSC Form No. 6 Compliant Orchestrator
 */
const MyLeaves = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isWithinPhilippines, setIsWithinPhilippines] = useState(true);

  // Tab State for Supervisors / Managers
  const [activeMainTab, setActiveMainTab] = useState('mine'); // 'mine', 'approvals'

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
        if (typeof errorData === 'string') msg = errorData;
        else if (errorData.detail) msg = errorData.detail;
        else if (typeof errorData === 'object') {
          msg = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors[0] : errors}`)
            .join('\n');
        }
      }
      alert(msg);
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(`leaves/${id}/approve/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => alert(err.response?.data?.detail || "Approval failed.")
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.post(`leaves/${id}/reject/`, { disapproval_reason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVES] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => alert(err.response?.data?.detail || "Rejection failed.")
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    applyMutation.mutate(formData);
  };

  const isSupervisorOrManager = ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'].includes(user?.role) || employee?.is_supervisor;
  const myLeaves = leaves.filter(l => l.employee === employee?.id);
  const teamLeaves = leaves.filter(l => l.employee !== employee?.id);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center h-[60vh] items-center text-primary">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

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
          <LeaveBalanceCards employee={employee} />
          <LeaveHistorySection leaves={myLeaves} />
        </>
      )}

      {/* 2. TEAM APPROVALS VIEW */}
      {activeMainTab === 'approvals' && (
        <SupervisorApprovalQueue 
          teamLeaves={teamLeaves}
          onApprove={(id) => approveMutation.mutate(id)}
          onReject={({ id, reason }) => rejectMutation.mutate({ id, reason })}
          isApprovePending={approveMutation.isPending}
          isRejectPending={rejectMutation.isPending}
        />
      )}

      {/* CSC Form No. 6 Application Modal */}
      <LeaveApplicationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={applyMutation.isPending}
        leaveType={leaveType}
        setLeaveType={setLeaveType}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        isWithinPhilippines={isWithinPhilippines}
        setIsWithinPhilippines={setIsWithinPhilippines}
        durationDays={durationDays}
      />
    </div>
  );
};

export default MyLeaves;
