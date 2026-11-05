import React from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { POSITIONS } from './applyConstants';

const ApplicantInfoFields = ({ register, errors }) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="applicant-first_name" className="text-sm font-medium text-slate-700 ml-1">First Name</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-600 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
              <User className="w-4 h-4" />
            </div>
            <input
              id="applicant-first_name"
              aria-invalid={!!errors.first_name}
              aria-describedby={errors.first_name ? "applicant-first_name-error" : undefined}
              {...register('first_name', { required: "First name is required" })}
              type="text"
              placeholder="John"
              className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
            />
          </div>
          {errors.first_name && <p id="applicant-first_name-error" role="alert" className="text-xs text-error font-medium ml-1">{errors.first_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="applicant-middle_name" className="text-sm font-medium text-slate-700 ml-1">Middle Name</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-600 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
              <User className="w-4 h-4" />
            </div>
            <input
              id="applicant-middle_name"
              {...register('middle_name')}
              type="text"
              placeholder="M.I."
              className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="applicant-last_name" className="text-sm font-medium text-slate-700 ml-1">Last Name</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-600 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
              <User className="w-4 h-4" />
            </div>
            <input
              id="applicant-last_name"
              aria-invalid={!!errors.last_name}
              aria-describedby={errors.last_name ? "applicant-last_name-error" : undefined}
              {...register('last_name', { required: "Last name is required" })}
              type="text"
              placeholder="Doe"
              className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
            />
          </div>
          {errors.last_name && <p id="applicant-last_name-error" role="alert" className="text-xs text-error font-medium ml-1">{errors.last_name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="applicant-email" className="text-sm font-medium text-slate-700 ml-1">Email Address</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-600 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="applicant-email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "applicant-email-error" : undefined}
              {...register('email', { 
                 required: "Email is required",
                 pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
              })}
              type="email"
              placeholder="john.doe@example.com"
              className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
            />
          </div>
          {errors.email && <p id="applicant-email-error" role="alert" className="text-xs text-error font-medium ml-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="applicant-phone" className="text-sm font-medium text-slate-700 ml-1">Mobile Number</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-600 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id="applicant-phone"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "applicant-phone-error" : undefined}
              {...register('phone', { required: "Contact number is required" })}
              type="tel"
              autoComplete="tel"
              placeholder="09123456789"
              className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
            />
          </div>
          {errors.phone && <p id="applicant-phone-error" role="alert" className="text-xs text-error font-medium ml-1">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="applicant-position_applied" className="text-sm font-medium text-slate-700 ml-1">Target Position</label>
        <select
          id="applicant-position_applied"
          aria-invalid={!!errors.position_applied}
          aria-describedby={errors.position_applied ? "applicant-position_applied-error" : undefined}
          {...register('position_applied', { required: "Please select a target position" })}
          className="select select-bordered w-full bg-base-50 border-base-200 focus:border-[#0038A8] rounded-xl text-xs font-bold"
        >
          <option value="">Select a Position</option>
          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {errors.position_applied && <p id="applicant-position_applied-error" role="alert" className="text-xs text-error font-medium ml-1">{errors.position_applied.message}</p>}
      </div>
    </>
  );
};

export default ApplicantInfoFields;
