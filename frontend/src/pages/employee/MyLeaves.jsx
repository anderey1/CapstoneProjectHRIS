import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  useLeaves, 
  LeaveBalanceCards, 
  LeaveHistorySection, 
  SupervisorApprovalQueue, 
  LeaveApplicationModal 
} from '../../features/leaves';

/**
 * MyLeaves (Employee View)
 * CSC Form No. 6 Self-Service Portal & Supervisory Endorsements
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
      // Error handled by hook toast
    }
  };

  const isSupervisorOrManager = 
    ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'].includes(user?.role) || employee?.is_supervisor;

  const pendingSubordinateCount = teamLeaves.filter(l => ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(l.status)).length;

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center h-[60vh] items-center text-primary">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#0038a8] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              DepEd SDO Lucena City
            </span>
            <span className="text-[11px] font-mono text-slate-500">CSC Form No. 6 (Revised 2020)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {activeMainTab === 'mine' ? 'Application for Leave Portal' : 'Subordinate Leave Endorsements'}
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {activeMainTab === 'mine' 
              ? 'Employee self-service leave applications, credit balances, and docket history.' 
              : 'Review and supervisory endorsement queue for division personnel.'}
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
            className="btn btn-sm bg-[#0038a8] text-white hover:bg-[#002b80] rounded font-semibold text-xs px-4 h-9 shadow-xs border-none flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            File CSC Form No. 6
          </button>
        )}
      </div>

      {/* Main Tab Toggle for Supervisors/Managers */}
      {isSupervisorOrManager && (
        <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
          <button 
            type="button"
            onClick={() => setActiveMainTab('mine')}
            className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeMainTab === 'mine' 
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Applications & Credits
          </button>
          <button 
            type="button"
            onClick={() => setActiveMainTab('approvals')}
            className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 ${
              activeMainTab === 'approvals' 
                ? 'bg-white text-[#0038a8] shadow-xs border border-slate-200/80 font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Team Endorsement Queue</span>
            {pendingSubordinateCount > 0 && (
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                {pendingSubordinateCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* 1. MY APPLICATIONS VIEW */}
      {activeMainTab === 'mine' && (
        <div className="space-y-6">
          <LeaveBalanceCards employee={employee} />
          <LeaveHistorySection leaves={myLeaves} />
        </div>
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
