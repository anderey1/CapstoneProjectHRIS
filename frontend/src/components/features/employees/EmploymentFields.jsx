import React, { useEffect } from 'react';
import { ROLES, DEPED_POSITIONS } from '../../../utils/constants';

/**
 * Work Info Fields (Employment)
 * 
 * Simple, professional redesign with high-density labels and standard radius.
 */
const EmploymentFields = ({ schools, salaryGrades, register, setValue, watch, errors }) => {
  const selectedPosition = watch('position');
  const selectedSG = watch('salary_grade');

  // Auto-set Salary & SG when position changes
  useEffect(() => {
    if (selectedPosition) {
      const match = salaryGrades?.find(sg => 
        sg.label?.toLowerCase().includes(selectedPosition.trim().toLowerCase())
      );
      if (match) {
        setValue('salary', match.amount);
        setValue('salary_grade', match.id);
      }
    }
  }, [selectedPosition, salaryGrades, setValue]);

  // Find label for display
  const currentSGDetails = salaryGrades?.find(sg => sg.id === parseInt(selectedSG));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Role</label>
          <select 
            {...register("role", { required: "Role is required" })}
            className={`select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest ${errors.role ? 'border-error' : ''}`}
          >
            <option value={ROLES.EMPLOYEE}>Employee</option>
            <option value={ROLES.HR}>HR Staff</option>
            <option value={ROLES.ADMIN}>Administrator</option>
            <option value={ROLES.SUPERVISOR}>Supervisor</option>
            <option value={ROLES.ACCOUNTANT}>Accountant</option>
          </select>
          {errors.role && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.role.message}</span>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Position</label>
          <select 
            {...register("position", { required: "Position is required" })}
            className={`select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.position ? 'border-error' : ''}`}
          >
            <option value="">Select Position</option>
            <optgroup label="TEACHING ROLES">
              {DEPED_POSITIONS.TEACHING.map(p => <option key={p} value={p}>{p}</option>)}
            </optgroup>
            <optgroup label="ADMINISTRATIVE ROLES">
              {DEPED_POSITIONS.ADMINISTRATIVE.map(p => <option key={p} value={p}>{p}</option>)}
            </optgroup>
            <optgroup label="NON-TEACHING ROLES">
              {DEPED_POSITIONS.NON_TEACHING.map(p => <option key={p} value={p}>{p}</option>)}
            </optgroup>
          </select>
          {errors.position && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.position.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Area</label>
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
          {errors.department && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.department.message}</span>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Workplace</label>
          <select 
            {...register("school")}
            className="select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest"
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
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">
            Salary Grade {currentSGDetails && <span className="text-primary font-black ml-1">(SG {currentSGDetails.grade})</span>}
          </label>
          <select 
            {...register("salary_grade")}
            className="select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest"
          >
            <option value="">Select SG</option>
            {salaryGrades?.map(sg => (
              <option key={sg.id} value={sg.id}>SG {sg.grade} - (₱{parseFloat(sg.amount).toLocaleString()})</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Monthly Salary</label>
          <div className="relative">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-30">₱</span>
             <input 
               {...register("salary", { required: "Salary is required" })}
               type="number" 
               step="0.01" 
               placeholder="0.00" 
               className={`input input-sm w-full pl-7 bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.salary ? 'border-error' : ''}`} 
             />
          </div>
          {errors.salary && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.salary.message}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Joined Date</label>
          <input 
            {...register("date_hired", { required: "Date is required" })}
            type="date" 
            className={`input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.date_hired ? 'border-error' : ''}`} 
          />
          {errors.date_hired && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.date_hired.message}</span>}
        </div>
      </div>
    </div>
  );
};

export default EmploymentFields;
