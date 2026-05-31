import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, CheckCircle2, XCircle, Clock as ClockIcon, CalendarCheck, CalendarRange, FileText, Upload } from 'lucide-react';
import api from '../../api/axios';
import { QUERY_KEYS } from '../../api/queryKeys';

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

/**
 * My Leaves (Employee View) - CSC Form No. 6 Compliant
 */
const MyLeaves = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('vacation');

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
            <h1 className="text-3xl font-black tracking-tight text-base-content uppercase">My Leaves</h1>
          </div>
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest ml-1">CSC Form No. 6 Compliant</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="btn btn-primary rounded-lg shadow-lg shadow-primary/20 px-8"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Application
        </button>
      </div>

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
                    {leave.status}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-base-content">
                    {new Date(leave.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(leave.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <p className="text-[10px] font-black opacity-30 uppercase tracking-tight italic">Filed: {new Date(leave.date_applied).toLocaleDateString()}</p>
                </div>

                {/* Context-specific details */}
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

      {/* Form Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box rounded-xl p-0 overflow-hidden border border-base-300 max-w-4xl shadow-2xl bg-white h-[90vh] flex flex-col">
            <div className="bg-base-50/50 border-b border-base-200 p-6 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-lg text-base-content uppercase tracking-tight">Application for Leave</h3>
                <p className="text-[10px] font-black opacity-30 mt-1 uppercase tracking-widest">CSC Form No. 6 (Revised 2020)</p>
              </div>
              <button 
                className="btn btn-ghost btn-sm btn-circle" 
                onClick={() => setIsModalOpen(false)}
              >
                <XCircle className="w-5 h-5 opacity-40" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
              {/* Type of Leave */}
              <div className="space-y-4 p-6 bg-base-50/50 rounded-xl border border-base-200">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">6.A Type of Leave to be Availed Of</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Select Type</label>
                    <select 
                      name="leave_type" 
                      className="select select-bordered select-sm w-full bg-white border-base-200 focus:border-primary rounded-lg text-xs font-bold" 
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
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Specify Other Type</label>
                      <input name="other_type_details" type="text" className="input input-bordered input-sm w-full bg-white border-base-200 rounded-lg text-xs font-bold" required />
                    </div>
                  )}
                </div>
              </div>

              {/* Details of Leave */}
              <div className="space-y-4 p-6 bg-base-50/50 rounded-xl border border-base-200">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">6.B Details of Leave</h4>
                
                {['vacation', 'special_privilege'].includes(leaveType) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Location</label>
                      <div className="flex gap-4 p-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="is_within_philippines" value="true" className="radio radio-primary radio-xs" defaultChecked />
                          <span className="text-[10px] font-bold uppercase">Within PH</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="is_within_philippines" value="false" className="radio radio-primary radio-xs" />
                          <span className="text-[10px] font-bold uppercase">Abroad</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Specify Location</label>
                      <input name="location_details" type="text" className="input input-bordered input-sm w-full bg-white border-base-200 rounded-lg text-xs font-bold" placeholder="Address/City/Country" />
                    </div>
                  </div>
                )}

                {['sick', 'women_special', 'rehabilitation'].includes(leaveType) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Treatment Type</label>
                      <div className="flex gap-4 p-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="is_in_hospital" value="true" className="radio radio-primary radio-xs" />
                          <span className="text-[10px] font-bold uppercase">In-Hospital</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="is_in_hospital" value="false" className="radio radio-primary radio-xs" defaultChecked />
                          <span className="text-[10px] font-bold uppercase">Out-Patient</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Specify Illness</label>
                      <input name="illness_details" type="text" className="input input-bordered input-sm w-full bg-white border-base-200 rounded-lg text-xs font-bold" placeholder="Diagnosis/Illness" required />
                    </div>
                  </div>
                )}

                {leaveType === 'study' && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Purpose of Study</label>
                    <select name="study_type" className="select select-bordered select-sm w-full bg-white border-base-200 rounded-lg text-xs font-bold" required>
                      <option value="masters">Completion of Master's Degree</option>
                      <option value="board_exam">BAR/Board Examination Review</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Working Days & Commutation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 p-6 bg-base-50/50 rounded-xl border border-base-200">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">6.C Dates Applied</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">Start Date</label>
                      <input name="start_date" type="date" className="input input-bordered input-sm w-full bg-white border-base-200 rounded-lg text-xs font-bold" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase opacity-40 ml-1">End Date</label>
                      <input name="end_date" type="date" className="input input-bordered input-sm w-full bg-white border-base-200 rounded-lg text-xs font-bold" required />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-6 bg-base-50/50 rounded-xl border border-base-200">
                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">6.D Commutation</h4>
                  <div className="flex gap-4 p-2 h-10 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="commutation" value="not_requested" className="radio radio-primary radio-xs" defaultChecked />
                      <span className="text-[10px] font-bold uppercase">Not Requested</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="commutation" value="requested" className="radio radio-primary radio-xs" />
                      <span className="text-[10px] font-bold uppercase">Requested</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Documentary Requirement */}
              {LEAVE_REQUIREMENTS[leaveType] !== "No documentary requirements." && (
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
              )}

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
