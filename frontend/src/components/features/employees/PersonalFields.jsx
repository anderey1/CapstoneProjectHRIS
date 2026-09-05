import React from 'react';

/**
 * Personal Info Fields
 * 
 * Simple, professional redesign with high-density labels and standard radius.
 * Expanded to include PDS (CS Form 212) fields.
 */
const PersonalFields = ({ isEdit, register, errors, watch }) => {
  return (
    <div className="space-y-8">
      {/* 1. Basic Name Info */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60 border-b border-base-100 pb-2">Full Name</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Middle Name</label>
            <input 
              {...register("middle_name")}
              type="text" 
              placeholder="Middle" 
              className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Name Extension</label>
            <input 
              {...register("name_extension")}
              type="text" 
              placeholder="e.g. Jr., Sr." 
              className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
            />
          </div>
        </div>
      </div>

      {/* 2. Birth & Status */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60 border-b border-base-100 pb-2">Birth & Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Date of Birth</label>
            <input 
              {...register("date_of_birth")}
              type="date" 
              className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Sex</label>
            <select 
              {...register("sex")}
              className="select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest"
            >
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Civil Status</label>
            <select 
              {...register("civil_status")}
              className="select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest"
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Place of Birth</label>
            <input 
              {...register("place_of_birth")}
              type="text" 
              placeholder="City/Municipality" 
              className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
            />
          </div>
        </div>
      </div>

      {/* 3. Government IDs */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60 border-b border-base-100 pb-2">Government IDs</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "UMID ID", name: "umid_id" },
            { label: "PAG-IBIG ID", name: "pagibig_id" },
            { label: "PHILHEALTH NO.", name: "philhealth_no" },
            { label: "PhilSys Number (ID)", name: "philsys_id" },
            { label: "TIN NO.", name: "tin_no" },
            { label: "AGENCY EMPLOYEE NO.", name: "agency_employee_no" },
          ].map(id => (
            <div key={id.name} className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest opacity-40 ml-1">{id.label}</label>
              <input 
                {...register(id.name)}
                type="text" 
                className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-bold" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Contact & Address */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60 border-b border-base-100 pb-2">Contact & Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Mobile No</label>
            <input 
              {...register("mobile_no")}
              type="text" 
              className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Residential Address</label>
            <textarea 
              {...register("residential_address")}
              className="textarea textarea-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold leading-tight" 
              rows="2"
            />
          </div>
        </div>
      </div>

      {/* 5. E-Signature Overlay */}
      <div className="space-y-4">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60 border-b border-base-100 pb-2">Digital Signature</h4>
        <div className="flex flex-col md:flex-row gap-6 items-start">
           {isEdit && watch("e_signature_preview") && (
              <div className="w-32 h-16 bg-base-100 border border-base-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0">
                 <img src={watch("e_signature_preview")} alt="Current Sig" className="max-h-full max-w-full object-contain" />
              </div>
           )}
           <div className="space-y-1.5 flex-1">
             <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Upload Signature Image</label>
             <input 
               {...register("e_signature_file")}
               type="file" 
               accept="image/*"
               className="file-input file-input-bordered file-input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-bold" 
             />
             <p className="text-[8px] font-bold opacity-30 uppercase ml-1">PNG with transparent background is best</p>
           </div>
        </div>
      </div>

      {/* 6. Account Details */}
      {!isEdit && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-base-100 pb-2">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60">Account Details</h4>
            <span className="text-[8px] bg-primary/10 text-primary font-black uppercase tracking-widest px-2 py-0.5 rounded">Optional</span>
          </div>
          <p className="text-[9px] font-bold text-base-content/40 uppercase leading-relaxed mb-2">
            Leave Username & Password blank to let the employee register their own portal account later.
          </p>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Username</label>
            <input 
              {...register("username")}
              type="text" 
              placeholder="e.g. jdoe2026 (Optional)" 
              className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Email</label>
              <input 
                {...register("email")}
                type="email" 
                placeholder="email@deped.gov.ph (Optional)" 
                className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Password</label>
              <input 
                {...register("password")}
                type="password" 
                placeholder="•••••••• (Optional)" 
                className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalFields;
