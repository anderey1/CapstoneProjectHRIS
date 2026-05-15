import React from 'react';

/**
 * Personal Info Fields
 * 
 * Simple, professional redesign with high-density labels and standard radius.
 */
const PersonalFields = ({ isEdit, register, errors }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">First Name</label>
          <input 
            {...register("first_name", { required: "First name is required" })}
            type="text" 
            placeholder="John" 
            className={`input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.first_name ? 'border-error' : ''}`} 
          />
          {errors.first_name && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.first_name.message}</span>}
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Last Name</label>
          <input 
            {...register("last_name", { required: "Last name is required" })}
            type="text" 
            placeholder="Doe" 
            className={`input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.last_name ? 'border-error' : ''}`} 
          />
          {errors.last_name && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.last_name.message}</span>}
        </div>
      </div>

      {!isEdit && (
        <>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Username</label>
            <input 
              {...register("username", { required: !isEdit ? "Username is required" : false })}
              type="text" 
              placeholder="e.g. jdoe2026" 
              className={`input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.username ? 'border-error' : ''}`} 
            />
            {errors.username && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.username.message}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Email</label>
              <input 
                {...register("email", { 
                  required: !isEdit ? "Email is required" : false,
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                type="email" 
                placeholder="email@deped.gov.ph" 
                className={`input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.email ? 'border-error' : ''}`} 
              />
              {errors.email && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.email.message}</span>}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Password</label>
              <input 
                {...register("password", { required: !isEdit ? "Password is required" : false })}
                type="password" 
                placeholder="••••••••" 
                className={`input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold ${errors.password ? 'border-error' : ''}`} 
              />
              {errors.password && <span className="text-[9px] font-bold text-error uppercase tracking-tight ml-1">{errors.password.message}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PersonalFields;
