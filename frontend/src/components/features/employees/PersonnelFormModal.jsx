import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Briefcase, ChevronRight, FileText, AlertCircle, BookOpen } from 'lucide-react';
import { ROLES } from '../../../utils/constants';
import PersonalFields from './PersonalFields';
import EmploymentFields from './EmploymentFields';
import PDSUploadForm from '../recruitment/PDSUploadForm';
import { FamilyFields, EducationFields, EligibilityFields, WorkHistoryFields } from './PDSDetailFields';

const PersonnelFormModal = ({ isOpen, onClose, onSubmit, isPending, schools, initialData }) => {
  const [activeTab, setActiveTab] = useState('personal'); 
  const [showPDSImport, setShowPDSImport] = useState(false);
  const isEdit = !!initialData;

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    watch,
    control,
    formState: { errors } 
  } = useForm({
    defaultValues: initialData || {
      role: ROLES.EMPLOYEE,
      department: '',
      school: '',
      salary: '',
      date_hired: '',
      family: [],
      education: [],
      eligibilities: [],
      work_experience: []
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
        if (initialData.user_details?.role) {
          setValue('role', initialData.user_details.role);
        }
      } else {
        reset({
          role: ROLES.EMPLOYEE,
          department: '',
          school: '',
          salary: '',
          date_hired: '',
          family: [],
          education: [],
          eligibilities: [],
          work_experience: []
        });
      }
      setActiveTab('personal');
      setShowPDSImport(false);
    }
  }, [isOpen, initialData, reset, setValue]);

  if (!isOpen) return null;

  const employeeRole = watch('role');
  const setEmployeeRole = (val) => setValue('role', val);

  const handleProcessSubmit = (data) => {
    onSubmit(data);
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handlePDSExtraction = (data) => {
    // Pre-fill form fields from extracted data
    if (data.first_name) setValue('first_name', data.first_name);
    if (data.last_name) setValue('last_name', data.last_name);
    if (data.middle_name) setValue('middle_name', data.middle_name);
    if (data.name_extension) setValue('name_extension', data.name_extension);

    if (data.email) {
      setValue('email', data.email);
      // Auto-generate username from email
      const username = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      setValue('username', username);
    }

    if (data.date_of_birth) setValue('date_of_birth', formatDateForInput(data.date_of_birth));
    if (data.place_of_birth) setValue('place_of_birth', data.place_of_birth);
    if (data.sex) setValue('sex', data.sex);
    if (data.civil_status) setValue('civil_status', data.civil_status);

    if (data.gsis_id) setValue('gsis_id', data.gsis_id);
    if (data.pagibig_id) setValue('pagibig_id', data.pagibig_id);
    if (data.philhealth_no) setValue('philhealth_no', data.philhealth_no);
    if (data.sss_no) setValue('sss_no', data.sss_no);
    if (data.tin_no) setValue('tin_no', data.tin_no);
    if (data.agency_employee_no) setValue('agency_employee_no', data.agency_employee_no);

    if (data.mobile_no) setValue('mobile_no', data.mobile_no);
    if (data.residential_address) setValue('residential_address', data.residential_address);
    if (data.permanent_address) setValue('permanent_address', data.permanent_address);
    
    // Work Information
    if (data.position) setValue('position', data.position);
    if (data.department) setValue('department', data.department);
    if (data.salary) setValue('salary', data.salary);
    if (data.date_hired) setValue('date_hired', formatDateForInput(data.date_hired));

    setShowPDSImport(false);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-xl p-0 overflow-hidden border border-base-200 max-w-2xl shadow-2xl bg-white flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Page Header */}
        <div className="bg-base-50/50 border-b border-base-100 p-8 flex items-center justify-between">
          <div>
            <h3 className="font-black text-xl text-base-content uppercase tracking-tight">
              {isEdit ? 'Update Staff' : 'Add Staff'}
            </h3>
            <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">
              {isEdit 
                ? `Editing record for ${initialData.first_name}` 
                : 'Register a new employee record'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isEdit && !showPDSImport && (
              <button 
                type="button"
                onClick={() => setShowPDSImport(true)}
                className="btn btn-outline btn-primary btn-xs rounded-md text-[9px] font-black uppercase tracking-widest px-3"
              >
                <FileText className="w-3 h-3 mr-1" />
                Import PDS
              </button>
            )}
            <button 
              type="button"
              className="btn btn-ghost btn-sm btn-circle opacity-30 hover:opacity-100" 
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showPDSImport ? (
          <div className="p-8 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">PDS Auto-Fill</h4>
              <button 
                onClick={() => setShowPDSImport(false)}
                className="text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100"
              >
                Back to Manual Form
              </button>
            </div>
            <PDSUploadForm onExtractionComplete={handlePDSExtraction} />
            <div className="alert bg-info/5 border-info/10 text-[9px] font-bold text-info/70 rounded-lg py-2">
              <AlertCircle className="w-3 h-3" />
              <span>Extracted data will be pre-filled into the form fields.</span>
            </div>
          </div>
        ) : (
          <>
            {/* Professional Tabs */}
            <div className="flex border-b border-base-100 px-8 bg-white overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'personal' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent opacity-40 hover:opacity-100'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                1. Personal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('employment')}
                className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'employment' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent opacity-40 hover:opacity-100'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                2. Work
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-shrink-0 flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
                  activeTab === 'history' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent opacity-40 hover:opacity-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                3. PDS Sections
              </button>
            </div>
            
            <form onSubmit={handleSubmit(handleProcessSubmit)} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 overflow-y-auto flex-1 bg-white custom-scrollbar">
                <div className={activeTab !== 'personal' ? 'hidden' : ''}>
                  <PersonalFields 
                    isEdit={isEdit} 
                    register={register} 
                    errors={errors} 
                  />
                </div>
                <div className={activeTab !== 'employment' ? 'hidden' : ''}>
                  <EmploymentFields 
                    schools={schools} 
                    register={register} 
                    errors={errors}
                    employeeRole={employeeRole} 
                    setEmployeeRole={setEmployeeRole} 
                  />
                </div>
                <div className={activeTab !== 'history' ? 'hidden' : 'space-y-10'}>
                   <FamilyFields control={control} register={register} errors={errors} />
                   <EducationFields control={control} register={register} errors={errors} watch={watch} />
                   <EligibilityFields control={control} register={register} errors={errors} />
                   <WorkHistoryFields control={control} register={register} errors={errors} />
                </div>
              </div>

              {/* Clean Footer */}
              <div className="p-6 bg-base-50/50 border-t border-base-100 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  className="btn btn-ghost text-xs font-black uppercase tracking-widest opacity-40" 
                  onClick={onClose}
                >
                  Cancel
                </button>
                
                {activeTab === 'personal' ? (
                  <button 
                    type="button" 
                    className="btn btn-primary rounded-lg text-xs font-black uppercase tracking-widest px-8 shadow-md shadow-primary/20"
                    onClick={() => setActiveTab('employment')}
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                ) : activeTab === 'employment' ? (
                  <button 
                    type="button" 
                    className="btn btn-primary rounded-lg text-xs font-black uppercase tracking-widest px-8 shadow-md shadow-primary/20"
                    onClick={() => setActiveTab('history')}
                  >
                    Next Step
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className={`btn btn-primary rounded-lg text-xs font-black uppercase tracking-widest px-10 shadow-md shadow-primary/20 ${isPending ? 'loading' : ''}`}
                    disabled={isPending}
                  >
                    {isPending ? 'Saving...' : (isEdit ? 'Update' : 'Save Staff')}
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default PersonnelFormModal;
