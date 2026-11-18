import React, { useEffect } from 'react';
import { ROLES, DEPED_POSITIONS } from '../../../utils/constants';

/**
 * Work Info Fields (Employment)
 * 
 * Simple, professional redesign with high-density labels and standard radius.
 */
const EmploymentFields = ({ schools, salaryGrades, register, setValue, watch, errors, leaveStaff = [], currentEmployeeId }) => {
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

      // Sync staff category (Role) when picking a position
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

  // Filter positions based on role
  const getFilteredPositions = () => {
    if (selectedRole === ROLES.TEACHING) return DEPED_POSITIONS.TEACHING;
    if (selectedRole === ROLES.PRINCIPAL) return DEPED_POSITIONS.PRINCIPAL;
    if (selectedRole === ROLES.SUPERINTENDENT) return DEPED_POSITIONS.SUPERINTENDENT;
    if (selectedRole === ROLES.NON_TEACHING) return DEPED_POSITIONS.NON_TEACHING;
    if (selectedRole === ROLES.HR) return DEPED_POSITIONS.NON_TEACHING;
    if (selectedRole === ROLES.ACCOUNTANT) return DEPED_POSITIONS.NON_TEACHING;

    // Fallback for unselected
    return [
      ...DEPED_POSITIONS.TEACHING,
      ...DEPED_POSITIONS.PRINCIPAL,
      ...DEPED_POSITIONS.SUPERINTENDENT,
      ...DEPED_POSITIONS.NON_TEACHING
    ];
  };

  const filteredPositions = getFilteredPositions();

  // Find label for display
  const currentSGDetails = salaryGrades?.find(sg => sg.id === parseInt(selectedSG));

  return (
    <div className="space-y-6">
      <fieldset className="grid gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
        <legend className="px-2 text-sm font-semibold text-slate-800">Leave processing assignments</legend>
        <label className="space-y-1 text-xs font-medium text-slate-700">
          <span>Principal / Immediate Supervisor</span>
          <select {...register('supervisor')} className="select select-bordered min-h-11 w-full rounded-md border-slate-400 bg-white text-sm font-normal">
            <option value="">Not assigned</option>
            {leaveStaff.filter(person => person.id !== currentEmployeeId && (selectedRole !== ROLES.TEACHING || (person.role === ROLES.PRINCIPAL && selectedSchool && String(person.school) === String(selectedSchool)))).map(person => <option key={person.id} value={person.id}>{person.name}{person.position ? ` (${person.position})` : ''}</option>)}
          </select>
        </label>
        <p className="text-xs text-slate-600 md:col-span-2">Select the teacher's workplace to choose a principal from the same school. Teaching leave applications go to that principal for approval and signature, then to HR for completion.</p>
      </fieldset>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="personnel-role" className="text-sm font-medium text-slate-700">Role</label>
          <select
            id="personnel-role"
            {...register("role", { required: "Role is required" })}
            className={`select min-h-11 w-full bg-white border-slate-400 focus:border-primary rounded-md text-sm font-normal ${errors.role ? 'border-error' : ''}`}
          >
            <option value="">Select Role</option>
            <option value={ROLES.TEACHING}>Teaching Staff</option>
            <option value={ROLES.SUPERINTENDENT}>Superintendent</option>
            <option value={ROLES.PRINCIPAL}>School Principal</option>
            <option value={ROLES.NON_TEACHING}>Non-Teaching Staff</option>
            <option value={ROLES.HR}>HR Staff</option>
            <option value={ROLES.ACCOUNTANT}>Accountant</option>
          </select>
          {errors.role && <p className="text-sm text-error">{errors.role.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="personnel-position" className="text-sm font-medium text-slate-700">Position</label>
          <select
            id="personnel-position"
            {...register("position", { required: "Position is required" })}
            className={`select min-h-11 w-full bg-white border-slate-400 focus:border-primary rounded-md text-sm font-normal ${errors.position ? 'border-error' : ''}`}
          >
            <option value="">Select Position</option>
            {filteredPositions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {errors.position && <p className="text-sm text-error">{errors.position.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="personnel-department" className="text-sm font-medium text-slate-700">Area</label>
          <select
            id="personnel-department"
            {...register("department", { required: "Department is required" })}
            className={`select min-h-11 w-full bg-white border-slate-400 focus:border-primary rounded-md text-sm font-normal ${errors.department ? 'border-error' : ''}`}
          >
            <option value="">Select Area</option>
            <option value="Instructional">Instructional</option>
            <option value="Administrative">Administrative</option>
            <option value="Finance">Finance</option>
            <option value="Division Office">Division Office</option>
          </select>
          {errors.department && <p className="text-sm text-error">{errors.department.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="personnel-school" className="text-sm font-medium text-slate-700">Workplace</label>
          <select
            id="personnel-school"
            {...register("school", { required: selectedRole === ROLES.PRINCIPAL ? 'Assign a school to the principal.' : false })}
            className="select min-h-11 w-full bg-white border-slate-400 focus:border-primary rounded-md text-sm font-normal"
          >
            <option value="">Select Workplace</option>
            {schools?.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.school && <p className="text-sm text-error">{errors.school.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="personnel-salary-grade" className="text-sm font-medium text-slate-700">
            Salary grade {currentSGDetails && <span className="text-primary font-semibold ml-1">(SG {currentSGDetails.grade})</span>}
          </label>
          <select
            id="personnel-salary-grade"
            {...register("salary_grade")}
            className="select min-h-11 w-full bg-white border-slate-400 focus:border-primary rounded-md text-sm font-normal"
          >
            <option value="">Select SG</option>
            {salaryGrades?.map(sg => (
              <option key={sg.id} value={sg.id}>SG {sg.grade} - (₱{parseFloat(sg.amount).toLocaleString()})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="personnel-salary" className="text-sm font-medium text-slate-700">Monthly salary</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600">₱</span>
            <input
              id="personnel-salary"
              {...register("salary", { required: "Salary is required" })}
              type="number"
              step="0.01"
              placeholder="0.00"
              className={`input min-h-11 w-full pl-7 bg-white border-slate-400 focus:border-primary rounded-md text-sm font-normal ${errors.salary ? 'border-error' : ''}`}
            />
          </div>
          {errors.salary && <p className="text-sm text-error">{errors.salary.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="personnel-date-hired" className="text-sm font-medium text-slate-700">Joined date</label>
          <input
            id="personnel-date-hired"
            {...register("date_hired", { required: "Date is required" })}
            type="date"
            className={`input min-h-11 w-full bg-white border-slate-400 focus:border-primary rounded-md text-sm font-normal ${errors.date_hired ? 'border-error' : ''}`}
          />
          {errors.date_hired && <p className="text-sm text-error">{errors.date_hired.message}</p>}
        </div>
      </div>
    </div>
  );
};

export default EmploymentFields;
