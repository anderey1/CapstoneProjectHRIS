import React, { useEffect, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { ROLES, DEPED_POSITIONS } from '../../../utils/constants';

const labelRowClass = 'flex items-center justify-between gap-2 text-sm font-medium text-slate-800';
const inputClass = 'input input-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';
const selectClass = 'select select-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';

function FieldError({ id, error }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-error">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{error.message}</span>
    </p>
  );
}

/**
 * Work Info Fields (Employment, Assignment, Leave Routing, Compensation)
 */
const EmploymentFields = ({ schools, salaryGrades, register, setValue, watch, errors, leaveStaff = [], currentEmployeeId }) => {
  const id = useId();
  const fieldId = (name) => `${id}-${name}`;

  const selectedPosition = watch('position');
  const selectedSG = watch('salary_grade');
  const selectedRole = watch('role');
  const selectedSchool = watch('school');

  // Auto-set Salary & SG and sync Role when position changes
  useEffect(() => {
    if (selectedPosition) {
      const match = salaryGrades?.find(sg =>
        sg.label?.toLowerCase().includes(selectedPosition.trim().toLowerCase())
      );
      if (match) {
        setValue('salary', match.amount);
        setValue('salary_grade', match.id);
      }

      if (DEPED_POSITIONS.PRINCIPAL.includes(selectedPosition)) {
        if (selectedRole !== ROLES.PRINCIPAL) setValue('role', ROLES.PRINCIPAL);
      } else if (DEPED_POSITIONS.NON_TEACHING.includes(selectedPosition)) {
        if (![ROLES.NON_TEACHING, ROLES.HR, ROLES.ACCOUNTANT].includes(selectedRole)) {
          setValue('role', ROLES.NON_TEACHING);
        }
      } else if (DEPED_POSITIONS.TEACHING.includes(selectedPosition)) {
        if (selectedRole !== ROLES.TEACHING) {
          setValue('role', ROLES.TEACHING);
        }
      } else if (DEPED_POSITIONS.SUPERINTENDENT.includes(selectedPosition)) {
        if (selectedRole !== ROLES.SUPERINTENDENT) {
          setValue('role', ROLES.SUPERINTENDENT);
        }
      }
    }
  }, [selectedPosition, salaryGrades, setValue, selectedRole]);

  const getFilteredPositions = () => {
    if (selectedRole === ROLES.TEACHING) return DEPED_POSITIONS.TEACHING;
    if (selectedRole === ROLES.PRINCIPAL) return DEPED_POSITIONS.PRINCIPAL;
    if (selectedRole === ROLES.SUPERINTENDENT) return DEPED_POSITIONS.SUPERINTENDENT;
    if (selectedRole === ROLES.NON_TEACHING) return DEPED_POSITIONS.NON_TEACHING;
    if (selectedRole === ROLES.HR) return DEPED_POSITIONS.NON_TEACHING;
    if (selectedRole === ROLES.ACCOUNTANT) return DEPED_POSITIONS.NON_TEACHING;

    return [
      ...DEPED_POSITIONS.TEACHING,
      ...DEPED_POSITIONS.PRINCIPAL,
      ...DEPED_POSITIONS.SUPERINTENDENT,
      ...DEPED_POSITIONS.NON_TEACHING,
    ];
  };

  const filteredPositions = getFilteredPositions();
  const currentSGDetails = salaryGrades?.find(sg => sg.id === parseInt(selectedSG, 10));
  const eligibleSupervisors = leaveStaff.filter(
    person =>
      person.id !== currentEmployeeId &&
      (selectedRole !== ROLES.TEACHING ||
        (person.role === ROLES.PRINCIPAL && selectedSchool && String(person.school) === String(selectedSchool)))
  );

  return (
    <div className="space-y-7">
      {/* 1. Role & Position */}
      <section className="space-y-4" aria-labelledby={fieldId('role-heading')}>
        <div className="border-b border-slate-200 pb-2">
          <h3 id={fieldId('role-heading')} className="text-sm font-semibold text-slate-900">
            1. Role and plantilla position
          </h3>
          <p className="text-xs text-slate-500">Choosing a position updates the salary grade and monthly pay automatically.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('role')} className={labelRowClass}>
              <span>Role</span>
              <span className="text-xs font-medium text-primary">Required</span>
            </label>
            <select
              id={fieldId('role')}
              {...register('role', { required: 'Role is required' })}
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? fieldId('role-error') : undefined}
              className={`${selectClass} ${errors.role ? 'border-error' : ''}`}
            >
              <option value="">Select role</option>
              <option value={ROLES.TEACHING}>Teaching Staff</option>
              <option value={ROLES.SUPERINTENDENT}>Superintendent</option>
              <option value={ROLES.PRINCIPAL}>School Principal</option>
              <option value={ROLES.NON_TEACHING}>Non-Teaching Staff</option>
              <option value={ROLES.HR}>HR Staff</option>
              <option value={ROLES.ACCOUNTANT}>Accountant</option>
            </select>
            <FieldError id={fieldId('role-error')} error={errors.role} />
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('position')} className={labelRowClass}>
              <span>Position</span>
              <span className="text-xs font-medium text-primary">Required</span>
            </label>
            <select
              id={fieldId('position')}
              {...register('position', { required: 'Position is required' })}
              aria-invalid={Boolean(errors.position)}
              aria-describedby={errors.position ? fieldId('position-error') : undefined}
              className={`${selectClass} ${errors.position ? 'border-error' : ''}`}
            >
              <option value="">Select position</option>
              {filteredPositions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
            <FieldError id={fieldId('position-error')} error={errors.position} />
          </div>
        </div>
      </section>

      {/* 2. Assignment & Workplace */}
      <section className="space-y-4" aria-labelledby={fieldId('station-heading')}>
        <div className="border-b border-slate-200 pb-2">
          <h3 id={fieldId('station-heading')} className="text-sm font-semibold text-slate-900">
            2. Assignment and workplace
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('department')} className={labelRowClass}>
              <span>Area / Department</span>
              <span className="text-xs font-medium text-primary">Required</span>
            </label>
            <select
              id={fieldId('department')}
              {...register('department', { required: 'Department is required' })}
              aria-invalid={Boolean(errors.department)}
              aria-describedby={errors.department ? fieldId('department-error') : undefined}
              className={`${selectClass} ${errors.department ? 'border-error' : ''}`}
            >
              <option value="">Select area</option>
              <option value="Instructional">Instructional</option>
              <option value="Administrative">Administrative</option>
              <option value="Finance">Finance</option>
              <option value="Division Office">Division Office</option>
            </select>
            <FieldError id={fieldId('department-error')} error={errors.department} />
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('school')} className={labelRowClass}>
              <span>Workplace / School</span>
              <span className={`text-xs ${selectedRole === ROLES.PRINCIPAL ? 'font-medium text-primary' : 'font-normal text-slate-500'}`}>
                {selectedRole === ROLES.PRINCIPAL ? 'Required' : 'Optional'}
              </span>
            </label>
            <select
              id={fieldId('school')}
              {...register('school', { required: selectedRole === ROLES.PRINCIPAL ? 'Assign a school to the principal.' : false })}
              aria-invalid={Boolean(errors.school)}
              aria-describedby={errors.school ? fieldId('school-error') : undefined}
              className={`${selectClass} ${errors.school ? 'border-error' : ''}`}
            >
              <option value="">Select workplace</option>
              {schools?.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <FieldError id={fieldId('school-error')} error={errors.school} />
          </div>
        </div>
      </section>

      {/* 3. Leave Processing Assignment (placed after Role & Workplace) */}
      <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4" aria-labelledby={fieldId('leave-heading')}>
        <div>
          <h3 id={fieldId('leave-heading')} className="text-sm font-semibold text-slate-900">
            3. Leave processing assignment
          </h3>
          <p className="mt-0.5 text-xs text-slate-600">
            {selectedRole === ROLES.TEACHING && !selectedSchool
              ? 'Select a workplace above first to filter principals assigned to the same school.'
              : 'Teaching leave applications route to this principal for approval and signature before HR completion.'}
          </p>
        </div>

        <div className="min-w-0 space-y-1.5">
          <label htmlFor={fieldId('supervisor')} className={labelRowClass}>
            <span>Principal / Immediate supervisor</span>
            <span className="text-xs font-normal text-slate-500">Optional</span>
          </label>
          <select id={fieldId('supervisor')} {...register('supervisor')} className={selectClass}>
            <option value="">Not assigned</option>
            {eligibleSupervisors.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}{person.position ? ` (${person.position})` : ''}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* 4. Compensation & Appointment */}
      <section className="space-y-4" aria-labelledby={fieldId('comp-heading')}>
        <div className="border-b border-slate-200 pb-2">
          <h3 id={fieldId('comp-heading')} className="text-sm font-semibold text-slate-900">
            4. Compensation and appointment
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('salary_grade')} className={labelRowClass}>
              <span>
                Salary grade
                {currentSGDetails && (
                  <span className="ml-1 font-mono text-xs font-semibold text-primary">(SG {currentSGDetails.grade})</span>
                )}
              </span>
            </label>
            <select id={fieldId('salary_grade')} {...register('salary_grade')} className={`${selectClass} tabular-nums`}>
              <option value="">Select SG</option>
              {salaryGrades?.map((sg) => (
                <option key={sg.id} value={sg.id}>
                  SG {sg.grade} (₱{parseFloat(sg.amount).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('salary')} className={labelRowClass}>
              <span>Monthly salary</span>
              <span className="text-xs font-medium text-primary">Required</span>
            </label>
            <div className="relative">
              <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
                ₱
              </span>
              <input
                id={fieldId('salary')}
                {...register('salary', { required: 'Salary is required' })}
                type="number"
                step="0.01"
                placeholder="0.00"
                aria-invalid={Boolean(errors.salary)}
                aria-describedby={errors.salary ? fieldId('salary-error') : undefined}
                className={`${inputClass} pl-7 tabular-nums ${errors.salary ? 'border-error' : ''}`}
              />
            </div>
            <FieldError id={fieldId('salary-error')} error={errors.salary} />
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('date_hired')} className={labelRowClass}>
              <span>Joined date</span>
              <span className="text-xs font-medium text-primary">Required</span>
            </label>
            <input
              id={fieldId('date_hired')}
              {...register('date_hired', { required: 'Joined date is required' })}
              type="date"
              aria-invalid={Boolean(errors.date_hired)}
              aria-describedby={errors.date_hired ? fieldId('date_hired-error') : undefined}
              className={`${inputClass} tabular-nums ${errors.date_hired ? 'border-error' : ''}`}
            />
            <FieldError id={fieldId('date_hired-error')} error={errors.date_hired} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmploymentFields;
