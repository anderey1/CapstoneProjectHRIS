import React from 'react';
import { X, Loader2 } from 'lucide-react';

const PDSDetailModal = ({ 
  activeModal, 
  modalData, 
  modalIndex, 
  onClose, 
  onFieldChange, 
  onSave, 
  isPending 
}) => {
  if (!activeModal) return null;

  return (
    <div className="modal modal-open flex items-center justify-center bg-slate-900/60 z-[999] p-4 transition-all duration-200">
      <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full max-h-[85vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            {modalIndex !== null ? 'Edit' : 'Add'} {activeModal === 'personal' ? 'Profile' : activeModal.charAt(0).toUpperCase() + activeModal.slice(1)} Details
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Forms */}
        <div className="space-y-4 text-xs">
          
          {/* Personal Form */}
          {activeModal === 'personal' && (
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-slate-700">First Name</label>
                <input 
                  type="text" 
                  value={modalData?.first_name || ''} 
                  onChange={(e) => onFieldChange('first_name', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-slate-700">Last Name</label>
                <input 
                  type="text" 
                  value={modalData?.last_name || ''} 
                  onChange={(e) => onFieldChange('last_name', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Middle Name</label>
                <input 
                  type="text" 
                  value={modalData?.middle_name || ''} 
                  onChange={(e) => onFieldChange('middle_name', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Extension Name</label>
                <input 
                  type="text" 
                  value={modalData?.name_extension || ''} 
                  onChange={(e) => onFieldChange('name_extension', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  placeholder="Jr. / Sr."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Date of Birth</label>
                <input 
                  type="date" 
                  value={modalData?.date_of_birth || ''} 
                  onChange={(e) => onFieldChange('date_of_birth', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Sex</label>
                <select 
                  value={modalData?.sex || ''} 
                  onChange={(e) => onFieldChange('sex', e.target.value)}
                  className="select select-bordered select-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]"
                >
                  <option value="">Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Civil Status</label>
                <select 
                  value={modalData?.civil_status || ''} 
                  onChange={(e) => onFieldChange('civil_status', e.target.value)}
                  className="select select-bordered select-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]"
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Contact Number</label>
                <input 
                  type="text" 
                  value={modalData?.mobile_no || ''} 
                  onChange={(e) => onFieldChange('mobile_no', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-slate-700">Place of Birth</label>
                <input 
                  type="text" 
                  value={modalData?.place_of_birth || ''} 
                  onChange={(e) => onFieldChange('place_of_birth', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-slate-700">Residential Address</label>
                <textarea 
                  value={modalData?.residential_address || ''} 
                  onChange={(e) => onFieldChange('residential_address', e.target.value)}
                  className="textarea textarea-bordered textarea-sm w-full rounded-md text-xs h-16 pt-2 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="space-y-1 col-span-2">
                <label className="text-xs font-medium text-slate-700">Permanent Address</label>
                <textarea 
                  value={modalData?.permanent_address || ''} 
                  onChange={(e) => onFieldChange('permanent_address', e.target.value)}
                  className="textarea textarea-bordered textarea-sm w-full rounded-md text-xs h-16 pt-2 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
            </div>
          )}

          {/* Education Form */}
          {activeModal === 'education' && (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Academic Level</label>
                <select 
                  value={modalData?.level || ''} 
                  onChange={(e) => onFieldChange('level', e.target.value)}
                  className="select select-bordered select-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]"
                >
                  <option value="ELEMENTARY">Elementary</option>
                  <option value="SECONDARY">Secondary</option>
                  <option value="VOCATIONAL">Vocational / Trade Course</option>
                  <option value="BACCALAUREATE">Baccalaureate (College)</option>
                  <option value="GRADUATE_STUDIES">Graduate Studies</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">School / Institution Name</label>
                <input 
                  type="text" 
                  value={modalData?.school_name || ''} 
                  onChange={(e) => onFieldChange('school_name', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Degree / Basic Course</label>
                <input 
                  type="text" 
                  value={modalData?.degree_course || ''} 
                  onChange={(e) => onFieldChange('degree_course', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Period From</label>
                  <input 
                    type="text" 
                    value={modalData?.period_from || ''} 
                    onChange={(e) => onFieldChange('period_from', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                    placeholder="Year (e.g. 2012)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Period To</label>
                  <input 
                    type="text" 
                    value={modalData?.period_to || ''} 
                    onChange={(e) => onFieldChange('period_to', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                    placeholder="Year / Present"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Year Graduated</label>
                  <input 
                    type="text" 
                    value={modalData?.year_graduated || ''} 
                    onChange={(e) => onFieldChange('year_graduated', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Honors Received</label>
                  <input 
                    type="text" 
                    value={modalData?.honors_received || ''} 
                    onChange={(e) => onFieldChange('honors_received', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                    placeholder="e.g. Cum Laude"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Work Experience Form */}
          {activeModal === 'work' && (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Position Title</label>
                <input 
                  type="text" 
                  value={modalData?.position_title || ''} 
                  onChange={(e) => onFieldChange('position_title', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Employer / Agency Name</label>
                <input 
                  type="text" 
                  value={modalData?.agency || ''} 
                  onChange={(e) => onFieldChange('agency', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Period From</label>
                  <input 
                    type="date" 
                    value={modalData?.date_from || ''} 
                    onChange={(e) => onFieldChange('date_from', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Period To</label>
                  <input 
                    type="date" 
                    disabled={modalData?.is_present}
                    value={modalData?.is_present ? '' : (modalData?.date_to || '')} 
                    onChange={(e) => onFieldChange('date_to', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8] disabled:bg-slate-100" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="is_present"
                  checked={modalData?.is_present || false} 
                  onChange={(e) => {
                    onFieldChange('is_present', e.target.checked);
                    if (e.target.checked) onFieldChange('date_to', null);
                  }}
                  className="checkbox checkbox-xs rounded" 
                />
                <label htmlFor="is_present" className="text-xs font-medium text-slate-700 cursor-pointer">Currently Working Here</label>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Monthly Salary</label>
                  <input 
                    type="text" 
                    value={modalData?.monthly_salary || ''} 
                    onChange={(e) => onFieldChange('monthly_salary', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Appointment Status</label>
                  <select 
                    value={modalData?.status_of_appointment || ''} 
                    onChange={(e) => onFieldChange('status_of_appointment', e.target.value)}
                    className="select select-bordered select-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]"
                  >
                    <option value="PERMANENT">Permanent</option>
                    <option value="TEMPORARY">Temporary</option>
                    <option value="CONTRACTUAL">Contractual</option>
                    <option value="CASUAL">Casual</option>
                    <option value="CO-TERMINUS">Co-terminus</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5 items-end">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Salary Grade (SG)</label>
                  <input 
                    type="text" 
                    value={modalData?.salary_grade || ''} 
                    onChange={(e) => onFieldChange('salary_grade', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                    placeholder="e.g. 11"
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <input 
                    type="checkbox" 
                    id="is_gov_service"
                    checked={modalData?.is_gov_service || false} 
                    onChange={(e) => onFieldChange('is_gov_service', e.target.checked)}
                    className="checkbox checkbox-xs rounded" 
                  />
                  <label htmlFor="is_gov_service" className="text-xs font-medium text-slate-700 cursor-pointer">Government Service</label>
                </div>
              </div>
            </div>
          )}

          {/* Eligibility Form */}
          {activeModal === 'eligibility' && (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Exam / Board Title</label>
                <input 
                  type="text" 
                  value={modalData?.service || ''} 
                  onChange={(e) => onFieldChange('service', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Rating Obtained</label>
                  <input 
                    type="text" 
                    value={modalData?.rating || ''} 
                    onChange={(e) => onFieldChange('rating', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Exam Date</label>
                  <input 
                    type="date" 
                    value={modalData?.date_of_exam || ''} 
                    onChange={(e) => onFieldChange('date_of_exam', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Place of Exam</label>
                <input 
                  type="text" 
                  value={modalData?.place_of_exam || ''} 
                  onChange={(e) => onFieldChange('place_of_exam', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">License Number</label>
                  <input 
                    type="text" 
                    value={modalData?.license_no || ''} 
                    onChange={(e) => onFieldChange('license_no', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">License Date of Validity</label>
                  <input 
                    type="date" 
                    value={modalData?.license_date || ''} 
                    onChange={(e) => onFieldChange('license_date', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Family Member Form */}
          {activeModal === 'family' && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Relationship</label>
                  <select 
                    value={modalData?.relationship || ''} 
                    onChange={(e) => onFieldChange('relationship', e.target.value)}
                    className="select select-bordered select-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]"
                  >
                    <option value="SPOUSE">Spouse</option>
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="CHILD">Child</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Extension (Jr./Sr.)</label>
                  <input 
                    type="text" 
                    value={modalData?.extension || ''} 
                    onChange={(e) => onFieldChange('extension', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
              </div>
              {modalData?.relationship === 'CHILD' ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Full Name</label>
                  <input 
                    type="text" 
                    value={modalData?.full_name || ''} 
                    onChange={(e) => onFieldChange('full_name', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Surname</label>
                    <input 
                      type="text" 
                      value={modalData?.surname || ''} 
                      onChange={(e) => onFieldChange('surname', e.target.value)}
                      className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">First Name</label>
                    <input 
                      type="text" 
                      value={modalData?.first_name || ''} 
                      onChange={(e) => onFieldChange('first_name', e.target.value)}
                      className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Middle Name</label>
                    <input 
                      type="text" 
                      value={modalData?.middle_name || ''} 
                      onChange={(e) => onFieldChange('middle_name', e.target.value)}
                      className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Date of Birth</label>
                  <input 
                    type="date" 
                    value={modalData?.date_of_birth || ''} 
                    onChange={(e) => onFieldChange('date_of_birth', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Occupation</label>
                  <input 
                    type="text" 
                    value={modalData?.occupation || ''} 
                    onChange={(e) => onFieldChange('occupation', e.target.value)}
                    className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Employer / Agency</label>
                <input 
                  type="text" 
                  value={modalData?.employer || ''} 
                  onChange={(e) => onFieldChange('employer', e.target.value)}
                  className="input input-bordered input-sm w-full rounded-md text-xs h-9 bg-white border-slate-300 focus:border-[#0038A8]" 
                />
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="btn btn-sm h-8 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            disabled={isPending}
            className="btn btn-sm h-8 px-4 bg-[#0038A8] hover:bg-[#002d86] text-white rounded text-xs font-medium flex items-center gap-1.5 border-none shadow-sm"
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : 'Save Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PDSDetailModal;
