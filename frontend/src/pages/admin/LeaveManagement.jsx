import React, { useState } from 'react';
import { 
  X, AlertCircle, FileText, Search, Clock, CheckCircle2, XCircle, List
} from 'lucide-react';
import LeaveProcessingActions from '../../features/leaves/components/LeaveProcessingActions';
import LeaveWorkflowDetails from '../../features/leaves/components/LeaveWorkflowDetails';
import { formatLeaveStatus as formatStatus, PENDING_LEAVE_STATUSES } from '../../features/leaves/utils/leaveWorkflow';
import { 
  useLeaves, 
  DocumentAttachmentCard, 
  CSC_DOCUMENT_SPECS 
} from '../../features/leaves';
import Pagination from '../../components/common/Pagination';
import AccessibleDialog from '../../components/common/AccessibleDialog';

const getStatusBadge = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'pending_superintendent':
      return 'bg-amber-50 text-amber-900 border-amber-300 font-bold';
    case 'pending_hr':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'pending_checking':
    case 'pending_records':
    case 'returned':
    case 'pending_supervisor':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

/**
 * LeaveManagement (Admin/HR View)
 * CSC Form No. 6 Division Processing Docket
 */
const LeaveManagement = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');


  const { 
    leaves, 
    summary,
    pagination,
    isLoading, 
    approveLeave, 
    isApproving, 
    rejectLeave, 
    isRejecting,
    returnLeave,
    isReturning
  } = useLeaves({ search: searchTerm, status: activeTab, leave_type: filterType });
  const filteredLeaves = leaves;
  const pendingActionRequiredCount = summary.action_required || 0;
  const totalPendingCount = summary.pending || 0;
  const approvedCount = summary.statuses?.approved || 0;
  const rejectedCount = summary.statuses?.rejected || 0;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto" role="status">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave management</h1>
        <p className="mt-4 text-sm text-slate-600">Loading leave applications…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto [&_:is(button,a,input,select,textarea):focus-visible]:outline-2 [&_:is(button,a,input,select,textarea):focus-visible]:outline-offset-2 [&_:is(button,a,input,select,textarea):focus-visible]:outline-primary">
      {/* Header Banner */}
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-primary"><FileText size={20} aria-hidden="true" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave management</h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">CSC Form No. 6 (Revised 2020) · Division leave processing docket</p>
          </div>
        </div>

        {pendingActionRequiredCount > 0 && (
          <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span><strong className="tabular-nums">{pendingActionRequiredCount}</strong> {pendingActionRequiredCount === 1 ? 'application needs' : 'applications need'} your action</span>
          </div>
        )}
      </header>

      {/* Metric Summary Strip */}
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Leave application totals">
        {[['Pending review', totalPendingCount, 'text-slate-900', 'Applications in processing'], ['Awaiting your action', pendingActionRequiredCount, 'text-amber-800', 'Assigned for your review'], ['Approved', approvedCount, 'text-emerald-700', 'Approved leave applications'], ['Disapproved', rejectedCount, 'text-red-800', 'Disapproved applications']].map(([label, count, color, description]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-600">{label}</dt>
            <dd className={`mt-1 font-mono text-xl font-bold tabular-nums ${color}`}>{count}</dd>
            <dd className="mt-0.5 text-xs text-slate-500">{description}</dd>
          </div>
        ))}
      </dl>

      {/* Control Bar: Tabs + Filters */}
      <section className="min-w-0 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm" aria-label="Leave applications">
        {/* Institutional Tabs */}
        <nav className="flex overflow-x-auto border-b border-slate-200 px-3 sm:px-5" aria-label="Leave application status">
          {[
            { id: 'pending', label: 'Pending', count: totalPendingCount, icon: Clock },
            { id: 'approved', label: 'Approved', count: approvedCount, icon: CheckCircle2 },
            { id: 'rejected', label: 'Disapproved', count: rejectedCount, icon: XCircle },
            { id: 'all', label: 'All applications', icon: List },
          ].map(({ id, label, count, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 border-b-2 border-transparent px-3 py-3 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900 aria-pressed:border-primary aria-pressed:text-primary sm:px-4"
              aria-pressed={activeTab === id}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
              {count !== undefined && <span className={`rounded px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${activeTab === id ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-600'}`}>{count}</span>}
            </button>
          ))}
        </nav>

        {/* Filter & Search */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-end">
          <label className="min-w-0 text-xs font-semibold text-slate-600 sm:w-64" htmlFor="leave-type-filter">Leave type
          <select
            id="leave-type-filter"
            className="mt-2 block min-h-11 w-full rounded border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-primary focus:bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Leave Types</option>
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
            <option value="women_special">Special Benefits for Women</option>
            <option value="emergency">Special Emergency Leave</option>
            <option value="adoption">Adoption Leave</option>
            <option value="others">Others</option>
          </select>
          </label>

          <label className="min-w-0 flex-1 text-xs font-semibold text-slate-600" htmlFor="leave-search">Find an application
            <span className="relative mt-2 block">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              id="leave-search"
              type="search"
              placeholder="Search applicant or station"
              className="block min-h-11 w-full rounded border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-primary focus:bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            </span>
          </label>
        </div>
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 text-xs text-slate-600">
          <p>Showing <span className="font-mono font-semibold tabular-nums text-slate-900">{filteredLeaves.length}</span> of <span className="font-mono font-semibold tabular-nums text-slate-900">{pagination.count}</span> matching applications</p>
          <span>CSC Form No. 6</span>
        </div>

      {/* Main Administrative Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <th scope="col" className="px-4 py-3">Docket ID</th>
                <th scope="col" className="px-4 py-3">Applicant</th>
                <th scope="col" className="px-4 py-3">Office / Station</th>
                <th scope="col" className="px-4 py-3">Leave type</th>
                <th scope="col" className="px-4 py-3">Inclusive dates</th>
                <th scope="col" className="px-4 py-3 text-right">Work days</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => {
                  const isActionRequired = leave.can_approve && PENDING_LEAVE_STATUSES.includes(leave.status);
                  return (
                    <tr 
                      key={leave.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isActionRequired ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-600">
                        #{leave.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{leave.employee_name}</div>
                        <div className="mt-1 text-xs text-slate-600">Filed {new Date(leave.date_applied).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {leave.department || 'Division Office'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800 capitalize">
                          {leave.leave_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">
                        {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="mx-1 text-slate-400">→</span>
                        {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {leave.working_days_applied}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex w-fit rounded border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${getStatusBadge(leave.status)}`}>
                            {formatStatus(leave.status)}
                          </span>
                          {isActionRequired && (
                            <span className="text-xs font-medium text-amber-800 mt-1">
                              Your action required
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLeave(leave)}
                          className={`inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded border px-3 py-2 text-xs font-semibold transition-colors motion-reduce:transition-none ${
                            isActionRequired
                              ? 'border-primary bg-primary text-white hover:bg-secondary'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {isActionRequired ? 'Review & Sign' : 'View Docket'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-600">
                    No leave applications matched the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination pagination={pagination} label="leave applications" />
      </section>

      {/* Official CSC Form 6 Review Modal */}
      {selectedLeave && (
        <AccessibleDialog
          onClose={() => setSelectedLeave(null)}
          labelledBy="leave-review-title"
          className="flex h-[90dvh] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-xl"
        >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 p-4 sm:px-6 sm:py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    CSC Form No. 6
                  </span>
                  <span className="text-xs font-mono text-slate-500">Docket #{selectedLeave.id}</span>
                </div>
                <h3 id="leave-review-title" className="mt-2 text-base font-semibold leading-relaxed text-slate-900">
                  Application for Leave — {selectedLeave.employee_name}
                </h3>
              </div>
              <button 
                type="button"
                aria-label="Close leave application"
                onClick={() => setSelectedLeave(null)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 text-sm leading-relaxed text-slate-800 sm:p-6">
              
              {/* Section 6: Details of Application */}
              <div className="border border-slate-200 rounded">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-xs uppercase tracking-wide text-slate-700">
                  6. Details of Application
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/40">
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-500 block">6.A Type of Leave</span>
                    <span className="font-bold text-slate-900 capitalize text-sm">{selectedLeave.leave_type.replace('_', ' ')}</span>
                    {selectedLeave.other_type_details && (
                      <span className="text-xs text-slate-600 block mt-0.5 italic">({selectedLeave.other_type_details})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-500 block">6.C Inclusive Dates</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 text-xs">
                      {new Date(selectedLeave.start_date).toLocaleDateString()} — {new Date(selectedLeave.end_date).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500 block font-mono text-xs mt-0.5">
                      <strong>{selectedLeave.working_days_applied}</strong> working day(s) applied
                    </span>
                  </div>
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-500 block">6.D Commutation</span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selectedLeave.commutation?.replace('_', ' ') || 'Not Requested'}
                    </span>
                  </div>
                </div>

                {/* 6.B Details specification */}
                {(selectedLeave.location_details || selectedLeave.illness_details || selectedLeave.study_type) && (
                  <div className="px-4 py-3 border-t border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {selectedLeave.location_details && (
                      <div>
                        <span className="text-xs uppercase font-semibold text-slate-500 block">Where leave will be spent</span>
                        <span className="font-medium text-slate-800">
                          {selectedLeave.is_within_philippines ? 'Within Philippines' : 'Abroad'}: {selectedLeave.location_details}
                        </span>
                      </div>
                    )}
                    {selectedLeave.illness_details && (
                      <div>
                        <span className="text-xs uppercase font-semibold text-slate-500 block">Illness / Hospitalization</span>
                        <span className="font-medium text-slate-800">
                          {selectedLeave.is_in_hospital ? 'In-Hospital' : 'Out-Patient'}: {selectedLeave.illness_details}
                        </span>
                      </div>
                    )}
                    {selectedLeave.study_type && (
                      <div>
                        <span className="text-xs uppercase font-semibold text-slate-500 block">Study Leave Purpose</span>
                        <span className="font-medium text-slate-800 uppercase">
                          {selectedLeave.study_type.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 7.B: Certification of Leave Credits */}
              <div className="border border-slate-200 rounded">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-xs uppercase tracking-wide text-slate-700 flex justify-between items-center">
                  <span>7.B Certification of Leave Credits</span>
                  <span className="text-xs font-normal lowercase text-slate-500">certified by personnel officer</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50/50">
                  <div className="bg-white border border-slate-200 p-3 rounded">
                    <span className="text-xs uppercase font-bold text-slate-500 block">Vacation Leave Balance</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                        {selectedLeave.vacation_balance ?? 0}
                      </span>
                      <span className="text-xs text-slate-500">days available</span>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded">
                    <span className="text-xs uppercase font-bold text-slate-500 block">Sick Leave Balance</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                        {selectedLeave.sick_balance ?? 0}
                      </span>
                      <span className="text-xs text-slate-500">days available</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentary Attachments */}
              <div className="border border-slate-200 rounded">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-xs uppercase tracking-wide text-slate-700">
                  Documentary Attachments
                </div>
                <div className="p-3 space-y-2">
                  {CSC_DOCUMENT_SPECS.map(({ key, title, subtitle, color }) => {
                    const fileUrl = selectedLeave[key];
                    if (!fileUrl) return null;
                    return (
                      <DocumentAttachmentCard
                        key={key}
                        title={title}
                        subtitle={subtitle}
                        fileUrl={fileUrl}
                        color={color}
                      />
                    );
                  })}
                  {!CSC_DOCUMENT_SPECS.some(({ key }) => selectedLeave[key]) && (
                    <p className="text-slate-400 italic text-center py-2 text-xs">
                      No mandatory supporting documents attached to this application.
                    </p>
                  )}
                </div>
              </div>

              <LeaveWorkflowDetails leave={selectedLeave} />
              <LeaveProcessingActions
                key={selectedLeave.id}
                leave={selectedLeave}
                onApprove={approveLeave}
                onReject={rejectLeave}
                onReturn={returnLeave}
                pending={isApproving || isRejecting || isReturning}
                onComplete={() => setSelectedLeave(null)}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
              <button 
                type="button" 
                onClick={() => setSelectedLeave(null)}
                className="inline-flex min-h-11 items-center justify-center rounded border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Close Record
              </button>
            </div>
        </AccessibleDialog>
      )}
    </div>
  );
};

export default LeaveManagement;
