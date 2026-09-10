import React, { useState } from 'react';
import { Plus, CalendarRange } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  useLeaves, 
  LeaveBalanceCards, 
  LeaveHistorySection, 
  SupervisorApprovalQueue, 
  LeaveApplicationModal 
} from '../../features/leaves';

/**
 * MyLeaves (Employee View) - CSC Form No. 6 Compliant Orchestrator
 * Clean feature-hook driven view with zero data-fetching boilerplate.
 */
const MyLeaves = () => {
  const { user } = useAuth();
  const {
    employee,
    myLeaves,
    teamLeaves,
    isLoading,
    applyLeave,
    isApplying,
    approveLeave,
    isApproving,
    rejectLeave,
    isRejecting,
    calculateWorkingDays,
  } = useLeaves();

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isWithinPhilippines, setIsWithinPhilippines] = useState(true);

  // Tab State for Supervisors / Managers
  const [activeMainTab, setActiveMainTab] = useState('mine');

  const durationDays = calculateWorkingDays(startDate, endDate);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await applyLeave(formData);
      setIsModalOpen(false);
    } catch {
      // Error handled by hook's toast
    }
  };

  const isSupervisorOrManager = 
    ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'].includes(user?.role) || employee?.is_supervisor;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center h-[60vh] items-center text-primary">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
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
          onApprove={(id) => approveLeave(id)}
          onReject={({ id, reason }) => rejectLeave({ id, reason })}
          isApprovePending={isApproving}
          isRejectPending={isRejecting}
        />
      )}

      {/* CSC Form No. 6 Application Modal */}
      <LeaveApplicationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={isApplying}
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
