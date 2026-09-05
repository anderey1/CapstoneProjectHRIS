import React from 'react';
import { Clock as ClockIcon, CalendarCheck, FileText } from 'lucide-react';

const formatStatus = (status) => {
  if (status === 'pending_supervisor') return 'Pending Supervisor';
  if (status === 'pending_hr') return 'Pending HR';
  if (status === 'pending_superintendent') return 'Pending Superintendent';
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  return status;
};

/**
 * LeaveHistorySection
 * Renders personal filed leaves grid with status badges, dates, and attachments.
 */
const LeaveHistorySection = ({ leaves }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <ClockIcon className="w-4 h-4 text-primary opacity-40" />
        <h2 className="text-[11px] font-black uppercase tracking-widest opacity-40">Application History</h2>
      </div>
      
      {leaves.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaves.map((leave) => (
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
  );
};

export default LeaveHistorySection;
