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
      if (DEPED_POSITIONS.NON_TEACHING.includes(selectedPosition)) {
        if (![ROLES.NON_TEACHING, ROLES.HR, ROLES.ACCOUNTANT].includes(selectedRole)) {
          setValue('role', ROLES.NON_TEACHING);
        }
      } else if (DEPED_POSITIONS.TEACHING.includes(selectedPosition)) {
        if (selectedRole !== ROLES.TEACHING) {
          setValue('role', ROLES.TEACHING);
        }
      } else if (DEPED_POSITIONS.ADMINISTRATIVE.includes(selectedPosition)) {
        if (selectedRole !== ROLES.ADMINISTRATIVE) {
          setValue('role', ROLES.ADMINISTRATIVE);
        }
      }
    }
  }, [selectedPosition, salaryGrades, setValue, selectedRole]);

  // Filter positions based on role
  const getFilteredPositions = () => {
    if (selectedRole === ROLES.TEACHING) return DEPED_POSITIONS.TEACHING;
    if (selectedRole === ROLES.ADMINISTRATIVE) return DEPED_POSITIONS.ADMINISTRATIVE;
    if (selectedRole === ROLES.NON_TEACHING) return DEPED_POSITIONS.NON_TEACHING;
    if (selectedRole === ROLES.HR) return DEPED_POSITIONS.NON_TEACHING;
    if (selectedRole === ROLES.ACCOUNTANT) return DEPED_POSITIONS.NON_TEACHING;
    
    // Fallback for unselected
    return [
      ...DEPED_POSITIONS.TEACHING,
      ...DEPED_POSITIONS.ADMINISTRATIVE,
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
          <select {...register('supervisor')} className="select select-bordered select-sm w-full">
            <option value="">Not assigned</option>
            {leaveStaff.filter(person => person.id !== currentEmployeeId).map(person => <option key={person.id} value={person.id}>{person.name}{person.position ? ` (${person.position})` : ''}</option>)}
          </select>
        </label>
        <p className="text-xs text-slate-600 md:col-span-2">Teaching leave applications go to the assigned Principal / Immediate Supervisor for approval and signature, then to HR for completion.</p>
      </fieldset>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Role</label>
          <select 
            {...register("role", { required: "Role is required" })}
            className={`select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest ${errors.role ? 'border-error' : ''}`}
          >
            <option value="">Select Role</option>
            <option value={ROLES.TEACHING}>Teaching Staff</option>
            <option value={ROLES.ADMINISTRATIVE}>Administrative Staff</option>
            <option value={ROLES.NON_TEACHING}>Non-Teaching Staff</option>
            <option value={ROLES.HR}>HR Staff</option>
            <option value={ROLES.ACCOUNTANT}>Accountant</option>
          </select>
          {errors.role && <span className="text-xs font-bold text-error uppercase tracking-tight ml-1">{errors.role.message}</span>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Position</label>
          <select 
            {...register("position", { required: "Position is required" })}
            className={`select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.position ? 'border-error' : ''}`}
          >
            <option value="">Select Position</option>
            {filteredPositions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {errors.position && <span className="text-xs font-bold text-error uppercase tracking-tight ml-1">{errors.position.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Area</label>
          <select 
            {...register("department", { required: "Department is required" })}
            className={`select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest ${errors.department ? 'border-error' : ''}`}
          >
            <option value="">Select Area</option>
            <option value="Instructional">Instructional</option>
            <option value="Administrative">Administrative</option>
            <option value="Finance">Finance</option>
            <option value="ICT">ICT Section</option>
            <option value="Division Office">Division Office</option>
          </select>
          {errors.department && <span className="text-xs font-bold text-error uppercase tracking-tight ml-1">{errors.department.message}</span>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Workplace</label>
          <select 
            {...register("school")}
            className="select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-semibold uppercase tracking-wide"
          >
            <option value="">Select Workplace</option>
            {schools?.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">
            Salary Grade {currentSGDetails && <span className="text-primary font-semibold ml-1">(SG {currentSGDetails.grade})</span>}
          </label>
          <select 
            {...register("salary_grade")}
            className="select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-semibold uppercase tracking-wide"
          >
            <option value="">Select SG</option>
            {salaryGrades?.map(sg => (
              <option key={sg.id} value={sg.id}>SG {sg.grade} - (₱{parseFloat(sg.amount).toLocaleString()})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Monthly Salary</label>
          <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600">₱</span>
             <input 
               {...register("salary", { required: "Salary is required" })}
               type="number" 
               step="0.01" 
               placeholder="0.00" 
               className={`input input-sm w-full pl-7 bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.salary ? 'border-error' : ''}`} 
             />
          </div>
          {errors.salary && <span className="text-xs font-bold text-error uppercase tracking-tight ml-1">{errors.salary.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Joined Date</label>
          <input 
            {...register("date_hired", { required: "Date is required" })}
            type="date" 
            className={`input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.date_hired ? 'border-error' : ''}`} 
          />
          {errors.date_hired && <span className="text-xs font-bold text-error uppercase tracking-tight ml-1">{errors.date_hired.message}</span>}
        </div>
      </div>
    </div>
  );
};

export default EmploymentFields;
