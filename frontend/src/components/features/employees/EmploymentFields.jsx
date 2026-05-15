import React from 'react';

/**
 * Work Info Fields (Employment)
 * 
 * Simple, professional redesign with high-density labels and standard radius.
 */
const EmploymentFields = ({ schools, register, errors }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Role</label>
          <select 
            {...register("role", { required: "Role is required" })}
            className={`select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest ${errors.role ? 'border-error' : ''}`}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="HR">HR Staff</option>
            <option value="ADMIN">Administrator</option>
            <option value="SUPERVISOR">Supervisor</option>
          </select>
          {errors.role && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.role.message}</span>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Position</label>
          <input 
            {...register("position", { required: "Position is required" })}
            type="text" 
            placeholder="e.g. Admin Officer II" 
            className={`input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.position ? 'border-error' : ''}`} 
          />
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
