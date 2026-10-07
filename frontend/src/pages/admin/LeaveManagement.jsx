import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, Clock as ClockIcon, 
  Search, UserCheck, ShieldAlert,
  AlertCircle, FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  useLeaves, 
  DocumentAttachmentCard, 
  CSC_DOCUMENT_SPECS 
} from '../../features/leaves';

const formatStatus = (status) => {
  if (status === 'pending_supervisor') return 'Pending Supervisor';
  if (status === 'pending_hr') return 'Pending HR';
  if (status === 'pending_superintendent') return 'Pending Superintendent';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Disapproved';
  return status;
};

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const canManage = user?.role === 'HR';

  const { 
    leaves, 
    isLoading, 
    approveLeave, 
    isApproving, 
    rejectLeave, 
    isRejecting 
  } = useLeaves();

  // Tab filtering
  const tabLeaves = leaves.filter(l => {
    if (activeTab === 'pending') return ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(l.status);
    if (activeTab === 'approved') return l.status === 'approved';
    if (activeTab === 'rejected') return l.status === 'rejected';
    return true;
  });

  // Search & Type filtering
  const filteredLeaves = tabLeaves.filter(l => {
    const matchesSearch = 
      (l.employee_name && l.employee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.department && l.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.leave_type && l.leave_type.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || l.leave_type === filterType;
    return matchesSearch && matchesType;
  });

  // Action counts
  const pendingActionRequiredCount = leaves.filter(l => l.can_approve && ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(l.status)).length;
  const totalPendingCount = leaves.filter(l => ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(l.status)).length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;

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
            Division Leave Processing Docket
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Institutional verification and approval queue for personnel application for leave.
          </p>
        </div>

        {pendingActionRequiredCount > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span><strong className="font-mono tabular-nums">{pendingActionRequiredCount}</strong> application(s) awaiting your immediate action</span>
          </div>
        )}
      </div>

      {/* Metric Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Pending Review</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">{totalPendingCount}</span>
            <ClockIcon className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Awaiting Your Action</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">{pendingActionRequiredCount}</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Approved Records</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">{approvedCount}</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Disapproved</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-600">{rejectedCount}</span>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs + Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded border border-slate-200">
        {/* Institutional Tabs */}
        <div className="inline-flex rounded border border-slate-200 p-0.5 bg-slate-50">
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({totalPendingCount})
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'approved'
                ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('approved')}
          >
            Approved ({approvedCount})
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'rejected'
                ? 'bg-white text-rose-800 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('rejected')}
          >
            Disapproved ({rejectedCount})
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => setActiveTab('all')}
          >
            All Docket
          </button>
        </div>

        {/* Filter & Search */}
        <div className="flex items-center gap-2">
          <select
            className="select select-bordered select-xs h-8 text-xs font-medium bg-white border-slate-200 rounded"
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

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search applicant or station..."
              className="input input-bordered input-xs h-8 pl-8 text-xs bg-white border-slate-200 rounded w-48 lg:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Administrative Table */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-xs w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Docket ID</th>
                <th className="py-2.5 px-3">Applicant Name</th>
                <th className="py-2.5 px-3">Office / Station</th>
                <th className="py-2.5 px-3">Type of Leave</th>
                <th className="py-2.5 px-3">Inclusive Dates</th>
                <th className="py-2.5 px-3 text-right">Work Days</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => {
                  const isActionRequired = leave.can_approve && ['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(leave.status);
                  return (
                    <tr 
                      key={leave.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isActionRequired ? 'bg-amber-50/30' : ''}`}
                    >
                      <td className="py-2 px-3 font-mono text-[11px] font-medium text-slate-500">
                        #{leave.id}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900 text-xs">{leave.employee_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Filing Date: {new Date(leave.date_applied).toLocaleDateString()}</div>
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-600">
                        {leave.department || 'Division Office'}
                      </td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-xs text-slate-800 capitalize">
                          {leave.leave_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] tabular-nums text-slate-600">
                        {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="mx-1 text-slate-400">→</span>
                        {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-xs text-slate-900">
                        {leave.working_days_applied}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(leave.status)}`}>
                            {formatStatus(leave.status)}
                          </span>
                          {isActionRequired && (
                            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tight">
                              ● Action Required
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedLeave(leave)}
                          className={`btn btn-xs rounded text-[11px] font-semibold transition-colors ${
                            isActionRequired
                              ? 'bg-[#0038a8] text-white hover:bg-[#002b80] border-none px-3'
                              : 'btn-ghost border border-slate-200 text-slate-700 hover:bg-slate-100'
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
                  <td colSpan="8" className="py-12 text-center text-slate-400 text-xs">
                    No leave applications matched the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official CSC Form 6 Review Modal */}
      {selectedLeave && (
        <div className="modal modal-open">
          <div className="modal-box rounded-lg max-w-4xl p-0 overflow-hidden shadow-xl border border-slate-300 bg-white h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#0038a8] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                    CSC Form No. 6
                  </span>
                  <span className="text-xs font-mono text-slate-500">Docket #{selectedLeave.id}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 mt-0.5">
                  Application for Leave — {selectedLeave.employee_name}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => { setSelectedLeave(null); setRejectionReason(''); }} 
                className="btn btn-ghost btn-xs btn-circle text-slate-500 hover:text-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-white text-slate-800 text-xs">
              
              {/* Section 6: Details of Application */}
              <div className="border border-slate-200 rounded">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wide text-slate-700">
                  6. Details of Application
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/40">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">6.A Type of Leave</span>
                    <span className="font-bold text-slate-900 capitalize text-sm">{selectedLeave.leave_type.replace('_', ' ')}</span>
                    {selectedLeave.other_type_details && (
                      <span className="text-xs text-slate-600 block mt-0.5 italic">({selectedLeave.other_type_details})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">6.C Inclusive Dates</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 text-xs">
                      {new Date(selectedLeave.start_date).toLocaleDateString()} — {new Date(selectedLeave.end_date).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500 block font-mono text-[11px] mt-0.5">
                      <strong>{selectedLeave.working_days_applied}</strong> working day(s) applied
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">6.D Commutation</span>
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
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Where leave will be spent</span>
                        <span className="font-medium text-slate-800">
                          {selectedLeave.is_within_philippines ? 'Within Philippines' : 'Abroad'}: {selectedLeave.location_details}
                        </span>
                      </div>
                    )}
                    {selectedLeave.illness_details && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Illness / Hospitalization</span>
                        <span className="font-medium text-slate-800">
                          {selectedLeave.is_in_hospital ? 'In-Hospital' : 'Out-Patient'}: {selectedLeave.illness_details}
                        </span>
                      </div>
                    )}
                    {selectedLeave.study_type && (
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-500 block">Study Leave Purpose</span>
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
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wide text-slate-700 flex justify-between items-center">
                  <span>7.B Certification of Leave Credits</span>
                  <span className="text-[10px] font-normal lowercase text-slate-500">certified by personnel officer</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4 bg-slate-50/50">
                  <div className="bg-white border border-slate-200 p-3 rounded">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Vacation Leave Balance</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                        {selectedLeave.vacation_balance ?? 0}
                      </span>
                      <span className="text-xs text-slate-500">days available</span>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Sick Leave Balance</span>
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
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-[11px] uppercase tracking-wide text-slate-700">
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

              {/* Current Action / Processing Pipeline */}
              {['pending_supervisor', 'pending_hr', 'pending_superintendent'].includes(selectedLeave.status) ? (
                <div className="border border-slate-200 rounded p-4 bg-slate-50 space-y-3">
                  <div className="font-bold text-[11px] uppercase tracking-wide text-slate-700">
                    7. Action on Application
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Disapproval / Recommendation Reason (Required if disapproving)
                    </label>
                    <textarea 
                      className="textarea textarea-bordered textarea-xs w-full bg-white border-slate-300 rounded text-xs font-medium focus:border-primary" 
                      placeholder="State precise reason for disapproval or special instructions..."
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>

                  {selectedLeave.can_approve ? (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await rejectLeave({ id: selectedLeave.id, reason: rejectionReason });
                            setSelectedLeave(null);
                            setRejectionReason('');
                          } catch {
                            // Handled by hook
                          }
                        }}
                        disabled={isRejecting}
                        className="btn btn-sm btn-outline border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 rounded text-xs font-semibold px-4"
                      >
                        {isRejecting ? 'Processing...' : 'Disapprove'}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await approveLeave(selectedLeave.id);
                            setSelectedLeave(null);
                          } catch {
                            // Handled by hook
                          }
                        }}
                        disabled={isApproving}
                        className="btn btn-sm bg-[#0038a8] text-white hover:bg-[#002b80] rounded text-xs font-semibold px-5 border-none"
                      >
                        {isApproving ? 'Recording...' : (
                          selectedLeave.status === 'pending_supervisor' ? 'Recommend Approval (Supervisor)' :
                          selectedLeave.status === 'pending_hr' ? 'Verify & Certify (HR)' : 'Approve for Civil Service'
                        )}
                      </button>
                    </div>
                  ) : canManage ? (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 rounded text-xs font-medium text-center">
                      Docket is pending review at stage: <strong>{formatStatus(selectedLeave.status)}</strong>.
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-xs font-medium text-center italic">
                      Read-only docket inspection for your role. Current stage: {formatStatus(selectedLeave.status)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-slate-200 rounded p-4 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2">
                    {selectedLeave.status === 'approved' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                    <span className="font-bold text-sm text-slate-900">
                      Application Status: {formatStatus(selectedLeave.status)}
                    </span>
                  </div>
                  {selectedLeave.disapproval_reason && (
                    <div className="mt-2 text-xs bg-white border border-slate-200 p-2.5 rounded">
                      <span className="font-semibold text-slate-500 block uppercase text-[10px]">Official Reason:</span>
                      <p className="text-slate-700 italic mt-0.5">"{selectedLeave.disapproval_reason}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex justify-end shrink-0">
              <button 
                type="button" 
                onClick={() => { setSelectedLeave(null); setRejectionReason(''); }} 
                className="btn btn-xs btn-ghost border border-slate-200 text-slate-700 hover:bg-slate-100 rounded px-4 text-xs font-medium"
              >
                Close Record
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setSelectedLeave(null)}></div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
