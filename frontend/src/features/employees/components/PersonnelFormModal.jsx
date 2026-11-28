import React, { useState, useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { X, User, Briefcase, ChevronLeft, ChevronRight, FileText, AlertCircle, BookOpen } from 'lucide-react';
import { fetchAllPages } from '../../../api/pagination';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { ROLES } from '../../../utils/constants';
import PersonalFields from './PersonalFields';
import EmploymentFields from './EmploymentFields';
import PDSUploadForm from '../../../components/common/PDSUploadModal';
import AccessibleDialog from '../../../components/common/AccessibleDialog';
import { FamilyFields, EducationFields, EligibilityFields, WorkHistoryFields } from './PDSDetailFields';

function getTabFields(tab, isEdit) {
  if (tab === 'personal') {
    return isEdit ? ['first_name', 'last_name'] : ['first_name', 'last_name', 'username', 'email'];
  }
  if (tab === 'employment') {
    return ['role', 'position', 'department', 'school', 'salary', 'date_hired'];
  }
  return [];
}

function countTabErrors(errors, tab, isEdit) {
  if (tab === 'history') {
    return ['family', 'education', 'eligibilities', 'work_experience'].filter((key) => errors[key]).length;
  }
  return getTabFields(tab, isEdit).filter((field) => errors[field]).length;
}

const TABS = [
  { id: 'personal', label: '1. Personal & account', icon: User },
  { id: 'employment', label: '2. Work & assignment', icon: Briefcase },
  { id: 'history', label: '3. PDS history', icon: BookOpen },
];

const PersonnelFormModal = ({ isOpen, onClose, onSubmit, isPending, schools, initialData }) => {
  const id = useId();
  const [activeTab, setActiveTab] = useState('personal');
  const [showPDSImport, setShowPDSImport] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: initialData || {
      role: ROLES.TEACHING,
      department: '',
      school: '',
      salary: '',
      date_hired: '',
      family: [],
      education: [],
      eligibilities: [],
      work_experience: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      setBackendError(null);
      if (initialData) {
        reset({
          ...initialData,
          e_signature_preview: initialData.e_signature,
          e_signature_file: null,
        });
        if (initialData.user_details?.role) {
          setValue('role', initialData.user_details.role);
        }
      } else {
        reset({
          role: ROLES.TEACHING,
          department: '',
          school: '',
          salary: '',
          date_hired: '',
          family: [],
          education: [],
          eligibilities: [],
          work_experience: [],
          e_signature_file: null,
          e_signature_preview: null,
        });
        setValue('role', ROLES.TEACHING);
      }
      setActiveTab('personal');
      setShowPDSImport(false);
    }
  }, [isOpen, initialData, reset, setValue]);

  const { data: salaryGrades } = useQuery({
    queryKey: ['salary-grades'],
    queryFn: ({ signal }) => fetchAllPages('salary-grades/', {}, signal),
    enabled: isOpen,
  });

  const { data: leaveStaff = [], isError: isLeaveStaffError } = useQuery({
    queryKey: [QUERY_KEYS.LEAVE_STAFF],
    queryFn: ({ signal }) => fetchAllPages('employees/leave-staff/', {}, signal),
    enabled: isOpen,
  });

  const employeeRole = watch('role');
  const setEmployeeRole = (val) => setValue('role', val);

  const handleProcessSubmit = async (data) => {
    setBackendError(null);
    const cleanedData = { ...data };

    if (Array.isArray(cleanedData.family)) {
      cleanedData.family = cleanedData.family.filter(
        (item) =>
          (item.relationship === 'CHILD' && item.full_name) ||
          (item.relationship !== 'CHILD' && (item.surname || item.first_name))
      );
    }
    if (Array.isArray(cleanedData.education)) {
      cleanedData.education = cleanedData.education.filter((item) => item.school_name || item.degree_course);
    }
    if (Array.isArray(cleanedData.eligibilities)) {
      cleanedData.eligibilities = cleanedData.eligibilities.filter((item) => item.service);
    }
    if (Array.isArray(cleanedData.work_experience)) {
      cleanedData.work_experience = cleanedData.work_experience.filter((item) => item.position_title || item.agency);
    }

    try {
      await onSubmit(cleanedData);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData) {
        if (errorData.detail) setBackendError(errorData.detail);
        else if (typeof errorData === 'object') {
          const messages = Object.entries(errorData).map(
            ([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : JSON.stringify(val)}`
          );
          setBackendError(messages.join(' | '));
        } else {
          setBackendError('An unexpected server error occurred.');
        }
      } else {
        setBackendError('Unable to connect to the server.');
      }
    }
  };

  const handleInvalidSubmit = (formErrors) => {
    const firstInvalidTab = ['personal', 'employment', 'history'].find(
      (tab) => countTabErrors(formErrors, tab, isEdit) > 0
    );
    if (firstInvalidTab) setActiveTab(firstInvalidTab);
  };

  const handleNextTab = async (nextTab) => {
    if (!isEdit) {
      const fields = getTabFields(activeTab, isEdit);
      if (fields.length > 0) {
        const valid = await trigger(fields);
        if (!valid) return;
      }
    }
    setActiveTab(nextTab);
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handlePDSExtraction = (data) => {
    if (data.first_name) setValue('first_name', data.first_name);
    if (data.last_name) setValue('last_name', data.last_name);
    if (data.middle_name) setValue('middle_name', data.middle_name);
    if (data.name_extension) setValue('name_extension', data.name_extension);

    if (data.email) {
      setValue('email', data.email);
      const username = data.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      setValue('username', username);
    }

    if (data.date_of_birth) setValue('date_of_birth', formatDateForInput(data.date_of_birth));
    if (data.place_of_birth) setValue('place_of_birth', data.place_of_birth);
    if (data.sex) setValue('sex', data.sex);
    if (data.civil_status) setValue('civil_status', data.civil_status);

    if (data.umid_id) setValue('umid_id', data.umid_id);
    if (data.pagibig_id) setValue('pagibig_id', data.pagibig_id);
    if (data.philhealth_no) setValue('philhealth_no', data.philhealth_no);
    if (data.philsys_id) setValue('philsys_id', data.philsys_id);
    if (data.tin_no) setValue('tin_no', data.tin_no);
    if (data.agency_employee_no) setValue('agency_employee_no', data.agency_employee_no);

    if (data.mobile_no) setValue('mobile_no', data.mobile_no);
    if (data.residential_address) setValue('residential_address', data.residential_address);
    if (data.permanent_address) setValue('permanent_address', data.permanent_address);

    if (data.position) setValue('position', data.position);
    if (data.department) setValue('department', data.department);
    if (data.salary) setValue('salary', data.salary);
    if (data.date_hired) setValue('date_hired', formatDateForInput(data.date_hired));

    if (data.family && Array.isArray(data.family)) {
      setValue(
        'family',
        data.family.map((m) => ({
          ...m,
          date_of_birth: formatDateForInput(m.date_of_birth),
          full_name: m.relationship === 'CHILD' ? (m.full_name || `${m.first_name} ${m.surname}`.trim()) : '',
        }))
      );
    }
    if (data.education && Array.isArray(data.education)) {
      setValue(
        'education',
        data.education.map((e) => ({
          ...e,
          period_from: formatDateForInput(e.period_from),
          period_to: e.period_to === 'present' ? 'present' : formatDateForInput(e.period_to),
        }))
      );
    }
    if (data.eligibilities && Array.isArray(data.eligibilities)) {
      setValue(
        'eligibilities',
        data.eligibilities.map((e) => ({
          ...e,
          date_of_exam: formatDateForInput(e.date_of_exam),
          validity_date: formatDateForInput(e.validity_date),
        }))
      );
    }
    if (data.work_experience && Array.isArray(data.work_experience)) {
      setValue(
        'work_experience',
        data.work_experience.map((w) => ({
          ...w,
          date_from: formatDateForInput(w.date_from),
          date_to: w.date_to === 'present' ? 'present' : formatDateForInput(w.date_to),
        }))
      );
    }

    setShowPDSImport(false);
  };

  if (!isOpen) return null;

  const formId = `${id}-form`;

  return (
    <AccessibleDialog
      onClose={() => { if (!isPending) onClose(); }}
      labelledBy={`${id}-title`}
      describedBy={`${id}-subtitle`}
      noBackdropClose={isPending}
      className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl sm:max-h-[90dvh]"
    >
      {/* Sticky Header */}
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">Plantilla &amp; Personnel Record</p>
          <h2 id={`${id}-title`} className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">
            {isEdit ? 'Edit employee record' : 'Add existing employee'}
          </h2>
          <p id={`${id}-subtitle`} className="mt-0.5 text-xs text-slate-600">
            {isEdit
              ? `Updating profile for ${initialData.first_name} ${initialData.last_name}`
              : 'Encode an existing personnel record and send their account setup link.'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!isEdit && !showPDSImport && (
            <button
              type="button"
              onClick={() => setShowPDSImport(true)}
              className="btn btn-outline btn-sm min-h-11 gap-1.5 border-slate-300 bg-white text-slate-800 hover:border-primary hover:text-primary"
            >
              <FileText className="size-4" aria-hidden="true" />
              <span>Import PDS</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-square min-h-11 min-w-11 text-slate-600 hover:text-slate-900"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close employee dialog"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {showPDSImport ? (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <h3 className="text-sm font-semibold text-slate-900">Import CS Form 212 (PDS PDF)</h3>
            <button
              type="button"
              onClick={() => setShowPDSImport(false)}
              className="btn btn-outline btn-sm min-h-11 border-slate-300 text-slate-700"
            >
              Back to manual form
            </button>
          </div>
          <PDSUploadForm onExtractionComplete={handlePDSExtraction} />
          <p className="flex items-start gap-2 text-xs text-slate-600">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Extracted details will pre-fill the form tabs so you can review before saving.</span>
          </p>
        </div>
      ) : (
        <>
          {/* Section Tabs */}
          <div
            role="tablist"
            aria-label="Employee form sections"
            className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-white px-3 sm:px-5"
          >
            {TABS.map(({ id: tabId, label, icon: Icon }) => {
              const isSelected = activeTab === tabId;
              const errorCount = countTabErrors(errors, tabId, isEdit);
              return (
                <button
                  key={tabId}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tabId)}
                  className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
                    isSelected
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                  {errorCount > 0 && (
                    <span
                      className="inline-flex size-5 items-center justify-center rounded-full bg-error text-xs font-semibold text-white tabular-nums"
                      aria-label={`${errorCount} validation error${errorCount > 1 ? 's' : ''}`}
                    >
                      {errorCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <form
            id={formId}
            onSubmit={handleSubmit(handleProcessSubmit, handleInvalidSubmit)}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-5 py-5 sm:px-6"
            noValidate
          >
            {backendError && (
              <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-error" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-900">Could not save employee</p>
                  <p className="mt-1 break-words text-sm text-red-800">{backendError}</p>
                </div>
                <button
                  type="button"
                  aria-label="Dismiss save error"
                  onClick={() => setBackendError(null)}
                  className="btn btn-ghost btn-square min-h-11 min-w-11 shrink-0 text-error"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            )}

            <div className={activeTab !== 'personal' ? 'hidden' : ''}>
              <PersonalFields isEdit={isEdit} register={register} errors={errors} watch={watch} />
            </div>

            <div className={activeTab !== 'employment' ? 'hidden' : ''}>
              {isLeaveStaffError && (
                <p role="alert" className="mb-4 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-error">
                  <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                  <span>Could not load leave processing staff. Close and reopen this form to retry.</span>
                </p>
              )}
              <EmploymentFields
                leaveStaff={leaveStaff}
                currentEmployeeId={initialData?.id}
                schools={schools}
                salaryGrades={salaryGrades}
                register={register}
                setValue={setValue}
                watch={watch}
                errors={errors}
                employeeRole={employeeRole}
                setEmployeeRole={setEmployeeRole}
              />
            </div>

            <div className={activeTab !== 'history' ? 'hidden' : 'space-y-8'}>
              <FamilyFields control={control} register={register} errors={errors} watch={watch} />
              <EducationFields control={control} register={register} errors={errors} watch={watch} />
              <EligibilityFields control={control} register={register} errors={errors} />
              <WorkHistoryFields control={control} register={register} errors={errors} />
            </div>
          </form>

          {/* Sticky Footer */}
          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-6">
            <div className="flex items-center gap-2">
              {activeTab !== 'personal' && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm min-h-11 gap-1 border-slate-300 bg-white text-slate-700"
                  onClick={() => setActiveTab(activeTab === 'history' ? 'employment' : 'personal')}
                  disabled={isPending}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  <span>Back</span>
                </button>
              )}
              {activeTab !== 'history' && (
                <button
                  type="button"
                  className={`btn btn-sm min-h-11 gap-1 ${
                    isEdit
                      ? 'btn-outline border-slate-300 bg-white text-slate-700'
                      : 'btn-primary px-5'
                  }`}
                  onClick={() => handleNextTab(activeTab === 'personal' ? 'employment' : 'history')}
                  disabled={isPending}
                >
                  <span>Next step</span>
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                className="btn btn-ghost min-h-11 text-sm font-medium text-slate-700"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </button>
              {(isEdit || activeTab === 'history') && (
                <button
                  type="submit"
                  form={formId}
                  className="btn btn-primary min-h-11 px-5 text-sm font-semibold"
                  disabled={isPending}
                >
                  {isPending ? 'Saving...' : isEdit ? 'Save changes' : 'Save employee'}
                </button>
              )}
            </div>
          </footer>
        </>
      )}
    </AccessibleDialog>
  );
};

export default PersonnelFormModal;
