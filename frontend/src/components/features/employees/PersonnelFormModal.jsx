import React, { useState } from 'react';
import { UserPlus, X, Shield, Briefcase, User, Mail, Lock } from 'lucide-react';

const PersonnelFormModal = ({ isOpen, onClose, onSubmit, isPending, schools, initialData }) => {
  const [employeeRole, setEmployeeRole] = useState(initialData?.user_details?.role || 'EMPLOYEE');
  
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-2xl p-0 overflow-hidden border border-base-300 max-w-2xl shadow-xl bg-white">
        {/* Header: Solid & Professional */}
        <div className="bg-base-100 border-b border-base-200 p-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl flex items-center gap-2 text-base-content">
              {initialData ? <Shield className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
              {initialData ? 'Update Personnel Profile' : 'Add New Employee'}
            </h3>
            <p className="text-xs opacity-50 mt-1">
              {initialData ? `Modifying record for ${initialData.first_name} ${initialData.last_name}` : 'Fill out the form below to register a new personnel.'}
            </p>
          </div>
          <button 
            className="btn btn-ghost btn-sm btn-circle" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          
          {/* Section: Personal Information */}
          <div className="space-y-4">
             <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-l-4 border-primary pl-3">Personal Information</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">First Name</span></label>
                  <input name="first_name" type="text" defaultValue={initialData?.first_name} placeholder="John" className="input input-bordered w-full bg-base-100 rounded-lg" required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Last Name</span></label>
                  <input name="last_name" type="text" defaultValue={initialData?.last_name} placeholder="Doe" className="input input-bordered w-full bg-base-100 rounded-lg" required />
                </div>
             </div>
          </div>

          {/* Section: Portal Credentials - ONLY FOR NEW EMPLOYEES */}
          {!initialData && (
            <div className="space-y-4 pt-4 border-t border-base-200">
               <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-l-4 border-primary pl-3">Portal Credentials</h4>
               <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Username</span></label>
                  <input name="username" type="text" placeholder="johndoe123" className="input input-bordered w-full bg-base-100 rounded-lg" required />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-semibold">Email Address</span></label>
                    <input name="email" type="email" placeholder="john@example.com" className="input input-bordered w-full bg-base-100 rounded-lg" required />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-semibold">Password</span></label>
                    <input name="password" type="password" placeholder="••••••••" className="input input-bordered w-full bg-base-100 rounded-lg" required />
                  </div>
               </div>
            </div>
          )}

          {/* Section: Employment Details */}
          <div className="space-y-4 pt-4 border-t border-base-200">
             <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-l-4 border-primary pl-3">Employment Details</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">System Role</span></label>
                  <select name="role" className="select select-bordered w-full bg-base-100 rounded-lg" value={employeeRole} onChange={(e) => setEmployeeRole(e.target.value)} required>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR">HR Staff</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="SUPERVISOR">Supervisor</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Job Position</span></label>
                  <input name="position" type="text" defaultValue={initialData?.position} placeholder="Teacher I" className="input input-bordered w-full bg-base-100 rounded-lg" required />
                </div>
             </div>
             
             <div className="form-control">
               <label className="label"><span className="label-text font-semibold">Department</span></label>
               <select name="department" defaultValue={initialData?.department} className="select select-bordered w-full bg-base-100 rounded-lg" required>
                 <option value="">Select Department</option>
                 <option value="Admin">Administration</option>
                 <option value="Science">Science</option>
                 <option value="Math">Mathematics</option>
                 <option value="English">English</option>
                 <option value="Division Office">Division Office</option>
               </select>
             </div>

             <div className="form-control pt-4 border-t border-base-100">
                <label className="label"><span className="label-text font-semibold text-primary">Assigned School / Workstation</span></label>
                <select name="school" defaultValue={initialData?.school} className="select select-primary select-bordered w-full bg-base-100 rounded-lg" required>
                  <option value="">Select Station for Geo-Validation</option>
                  {schools?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <p className="text-[10px] opacity-40 mt-1 pl-1">Required for geo-validated attendance scanning.</p>
              </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Monthly Salary (₱)</span></label>
                  <input name="salary" type="number" step="0.01" defaultValue={initialData?.salary} placeholder="0.00" className="input input-bordered w-full bg-base-100 rounded-lg" required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text font-semibold">Hire Date</span></label>
                  <input name="date_hired" type="date" defaultValue={initialData?.date_hired} className="input input-bordered w-full bg-base-100 rounded-lg" required />
                </div>
             </div>
          </div>

          <div className="modal-action pt-6 border-t border-base-200 bg-base-50 p-6 -mx-8 -mb-8">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`btn btn-primary px-10 ${isPending ? 'loading' : ''}`}
              disabled={isPending}
            >
              {isPending ? 'Processing...' : (initialData ? 'Update Record' : 'Save Employee')}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/60" onClick={onClose}></div>
    </div>
  );
};

export default PersonnelFormModal;

