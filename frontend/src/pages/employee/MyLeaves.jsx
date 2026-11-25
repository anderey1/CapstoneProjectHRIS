import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  useLeaves, 
  LeaveBalanceCards, 
  LeaveHistorySection, 
  SupervisorApprovalQueue, 
  LeaveApplicationModal 
} from '../../features/leaves';
import { usePaginatedList } from '../../hooks/usePaginatedList';
import { QUERY_KEYS } from '../../api/queryKeys';
import PageHeader from '../../components/common/PageHeader';
import PageLoader from '../../components/common/PageLoader';

/**
 * MyLeaves (Employee View)
 * CSC Form No. 6 Self-Service Portal & Supervisory Endorsements
 */
const MyLeaves = () => {
  const { user } = useAuth();
  const [historySearch, setHistorySearch] = useState('');
  const [historyType, setHistoryType] = useState('all');
  const {
    employee,
    myLeaves,
    pagination,
    isLoading,
    applyLeave,
    isApplying,
    approveLeave,
    isApproving,
    rejectLeave,
    isRejecting,
    returnLeave,
    isReturning,
  } = useLeaves({ scope: 'mine', search: historySearch, leave_type: historyType });
  const { summary: teamSummary } = usePaginatedList(QUERY_KEYS.LEAVES, 'leaves/', { scope: 'team', status: 'pending', search: '' });

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [leaveType, setLeaveType] = useState('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isWithinPhilippines, setIsWithinPhilippines] = useState(true);

  // Tab State for Supervisors / Managers
  const [searchParams, setSearchParams] = useSearchParams();
  const activeMainTab = searchParams.get('tab') === 'approvals' ? 'approvals' : 'mine';
  const setActiveMainTab = tab => setSearchParams(tab === 'approvals' ? { tab } : {});


  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    for (const [key, value] of [...formData.entries()]) {
      if (value instanceof File && value.size === 0) formData.delete(key);
    }
    try {
      await applyLeave({ formData, id: editingLeave?.id });
      setIsModalOpen(false);
    } catch {
      // Error handled by hook toast
    }
  };

  const isSupervisorOrManager = 
    user?.is_superuser || ['HR', 'SUPERINTENDENT', 'PRINCIPAL'].includes(user?.role) || employee?.is_supervisor;

  const pendingSubordinateCount = teamSummary.action_required || 0;

  if (isLoading) {
    return <PageLoader label="Loading leave applications..." />;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={activeMainTab === 'mine' ? 'Application for Leave Portal' : 'Subordinate Leave Endorsements'}
        badge="CSC Form No. 6 (Revised 2020)"
        subtitle={
          activeMainTab === 'mine'
            ? 'Employee self-service leave applications, credit balances, and docket history.'
            : 'Review and supervisory endorsement queue for division personnel.'
        }
      >
        {activeMainTab === 'mine' && (
          <button
            type="button"
            onClick={() => {
              setEditingLeave(null);
              setLeaveType('vacation');
              setStartDate('');
              setEndDate('');
              setIsWithinPhilippines(true);
              setIsModalOpen(true);
            }}
            className="btn btn-primary btn-sm gap-1.5"
          >
            <Plus className="w-4 h-4" />
            File CSC Form No. 6
          </button>
        )}
      </PageHeader>

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
                ? 'bg-white text-primary shadow-xs border border-slate-200/80 font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Leave Processing Queue</span>
            {pendingSubordinateCount > 0 && (
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-1.5 py-0.2 rounded font-mono">
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
          <LeaveHistorySection leaves={myLeaves} pagination={pagination}
            searchTerm={historySearch} setSearchTerm={setHistorySearch}
            filterType={historyType} setFilterType={setHistoryType} onCorrect={leave => {
            setEditingLeave(leave);
            setLeaveType(leave.leave_type);
            setStartDate(leave.start_date);
            setEndDate(leave.end_date);
            setIsWithinPhilippines(leave.is_within_philippines);
            setIsModalOpen(true);
          }} />
        </div>
      )}

      {/* 2. TEAM APPROVALS VIEW */}
      {activeMainTab === 'approvals' && (
        <SupervisorApprovalQueue 
          onApprove={approveLeave}
          onReject={({ id, reason }) => rejectLeave({ id, reason })}
          isApprovePending={isApproving}
          isRejectPending={isRejecting}
          onReturn={returnLeave}
          isReturnPending={isReturning}
        />
      )}

      {/* CSC Form No. 6 Application Modal */}
      <LeaveApplicationModal 
        employee={employee}
        key={editingLeave?.id || 'new'}
        initialData={editingLeave}
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
      />
    </div>
  );
};

export default MyLeaves;
