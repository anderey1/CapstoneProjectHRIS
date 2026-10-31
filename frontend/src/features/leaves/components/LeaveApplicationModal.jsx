import React, { useEffect } from 'react';
import { XCircle, CalendarRange, Upload, CheckCircle2 } from 'lucide-react';

/**
 * LeaveApplicationModal
 * Renders the CSC Form No. 6 leave application modal dialog.
 */
const LeaveApplicationModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  leaveType,
  setLeaveType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isWithinPhilippines,
  setIsWithinPhilippines,
  durationDays
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const minDateStr = `${yyyy}-${mm}-${dd}`;

  // CSC Form 6: Retrospective leaves (Sick, Emergency, Rehabilitation) allowed up to 30 days past
  const isRetrospective = ['sick', 'emergency', 'rehabilitation'].includes(leaveType);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const pastMinStr = thirtyDaysAgo.toISOString().split('T')[0];
  const effectiveMinDate = isRetrospective ? pastMinStr : minDateStr;

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-lg p-0 overflow-hidden border border-slate-200 max-w-4xl shadow-lg bg-white h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-[#0038A8]">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Application for Leave</h3>
              <p className="text-xs font-medium text-slate-500">CSC Form No. 6 (Revised 2020)</p>
            </div>
          </div>
          <button 
            type="button"
            className="btn btn-ghost btn-sm btn-circle text-slate-500 hover:text-slate-800" 
            onClick={onClose}
            aria-label="Close dialog"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 bg-base-50/20">
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
                    min={effectiveMinDate}
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
                    min={effectiveMinDate}
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

          {/* Documentary Requirements Uploads */}
          <div className="space-y-4 p-6 bg-primary/5 rounded-xl border border-primary/10 transition-all">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Documentary Requirements</h4>
              <span className="text-[8px] font-bold opacity-60 uppercase">Attach valid files (PDF / Image)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase opacity-40 ml-1">
                  {leaveType === 'sick' ? 'Medical Certificate (if > 5 days)' : 'Supporting Document'}
                </label>
                <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                  <input type="file" name="supporting_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Document</span>
                  </div>
                </div>
              </div>

              {['vacation', 'special_privilege'].includes(leaveType) && (!isWithinPhilippines || durationDays >= 30) && (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Travel Authority Document</label>
                    <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                      <input type="file" name="travel_authority_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Travel Authority</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase opacity-40 ml-1">Clearance Document</label>
                    <div className="relative group cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-lg p-4 transition-colors">
                      <input type="file" name="clearance_document" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-5 h-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">Upload Clearance</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="btn btn-ghost rounded-md text-xs font-semibold">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="btn btn-primary bg-[#0038A8] text-white hover:bg-[#002b80] rounded-md text-xs font-semibold px-6"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default LeaveApplicationModal;
