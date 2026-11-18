import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { X, UserPlus, Upload, FileText } from 'lucide-react';
import AccessibleDialog from '../../../components/common/AccessibleDialog';

/**
 * Add Applicant Modal - DepEd Modernized
 */
const AddApplicantModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  
  const resumeFile = watch('resume');

  const mutation = useMutation({
    mutationFn: (formData) => api.post('applicants/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] });
      reset();
      onClose();
      alert("Applicant registered successfully.");
    },
    onError: (err) => {
        const errData = err.response?.data;
        let msg = "Failed to add applicant.";
        if (typeof errData === 'object') {
            msg = Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join('\n');
        }
        alert(msg);
    }
  });

  const onSubmit = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (key === 'resume' && data[key][0]) {
            formData.append('resume', data[key][0]);
        } else {
            formData.append(key, data[key]);
        }
    });
    mutation.mutate(formData);
  };
  const closeModal = () => {
    if (!mutation.isPending) onClose();
  };

  return (
    <AccessibleDialog onClose={closeModal} labelledBy="add-applicant-title" className="bg-white rounded-lg w-full max-w-xl border border-slate-200 overflow-hidden max-h-[calc(100dvh-2rem)] flex flex-col">
        
        {/* Header */}
        <div className="bg-base-50/50 border-b border-base-100 p-4 sm:p-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner border border-primary/5">
                <UserPlus className="w-6 h-6" />
             </div>
             <div>
                <h2 id="add-applicant-title" className="text-lg font-semibold tracking-tight text-base-content leading-none">Register Applicant</h2>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mt-2">New Recruitment Entry</p>
             </div>
          </div>
          <button type="button" onClick={closeModal} disabled={mutation.isPending} className="btn btn-ghost btn-circle min-h-11 min-w-11 shrink-0 text-slate-600 hover:text-slate-900" aria-label="Close applicant registration">
             <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="applicant-first-name" className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">First Name</label>
              <input 
                id="applicant-first-name"
                className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold h-11" 
                {...register('first_name', { required: true })} 
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="applicant-middle-name" className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Middle Name</label>
              <input 
                id="applicant-middle-name"
                className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold h-11" 
                {...register('middle_name')} 
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="applicant-last-name" className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Last Name</label>
              <input 
                id="applicant-last-name"
                className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold h-11" 
                {...register('last_name', { required: true })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="applicant-position" className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Position Applied</label>
              <select 
                id="applicant-position"
                className="select select-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold h-11" 
                {...register('position_applied', { required: true })} 
              >
                <option value="">Select Position</option>
                <optgroup label="TEACHING ROLES">
                   <option value="Teacher I">Teacher I</option>
                   <option value="Teacher II">Teacher II</option>
                   <option value="Teacher III">Teacher III</option>
                   <option value="Master Teacher I">Master Teacher I</option>
                   <option value="Master Teacher II">Master Teacher II</option>
                   <option value="SPED Teacher I">SPED Teacher I</option>
                </optgroup>
                <optgroup label="NON-TEACHING ROLES">
                   <option value="Administrative Officer I">Administrative Officer I</option>
                   <option value="Administrative Officer II">Administrative Officer II</option>
                   <option value="Administrative Assistant I">Administrative Assistant I</option>
                   <option value="Administrative Assistant II">Administrative Assistant II</option>
                   <option value="Registrar I">Registrar I</option>
                   <option value="Accountant I">Accountant I</option>
                   <option value="School Principal I">School Principal I</option>
                </optgroup>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="applicant-division" className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Division</label>
              <input 
                id="applicant-division"
                className="input input-bordered w-full bg-base-50 border-base-200 rounded-lg text-xs font-bold h-11" 
                defaultValue="Lucena City"
                {...register('school_division')} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label htmlFor="applicant-email" className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Email Address</label>
              <input 
                id="applicant-email"
                type="email" 
                className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold h-11" 
                {...register('email', { required: true })} 
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="applicant-phone" className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Mobile Phone</label>
              <input 
                id="applicant-phone"
                className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold h-11" 
                {...register('phone', { required: true })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
               <label htmlFor="applicant-resume" className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Attach Resume / CV</label>
               <div className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-4 transition-all h-24 flex items-center justify-center focus-within:outline-2 focus-within:outline-primary ${resumeFile?.[0] ? 'border-success/30 bg-success/5' : 'border-base-200 hover:border-primary/40 bg-base-50'}`}>
                  <input 
                    id="applicant-resume"
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    {...register('resume')}
                  />
                  <div className="flex flex-col items-center gap-1">
                    {resumeFile?.[0] ? (
                        <>
                           <FileText className="w-5 h-5 text-success" />
                           <span role="status" className="text-xs text-slate-700 break-all text-center">File added: {resumeFile[0].name}</span>
                        </>
                    ) : (
                        <>
                           <Upload className="w-5 h-5 text-primary text-slate-600 group-hover:opacity-100 transition-opacity" />
                           <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide group-hover:opacity-100">Upload PDF</span>
                        </>
                    )}
                  </div>
               </div>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="applicant-initial-status" className="text-xs font-semibold uppercase tracking-wide text-slate-600 ml-1">Initial Application Status</label>
              <select id="applicant-initial-status" className="select select-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-xl text-xs font-semibold uppercase tracking-wide h-24" {...register('status')}>
                <option value="applied">Applied / Submitted</option>
                <option value="initial_evaluation">Initial Qualifications Review</option>
                <option value="comparative_assessment">Comparative Assessment</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-base-100">
            <button type="button" className="btn btn-ghost flex-1 text-xs font-semibold uppercase tracking-wide text-slate-600 h-12" onClick={closeModal} disabled={mutation.isPending}>Discard</button>
            <button type="submit" className="btn btn-primary flex-[2] rounded-xl font-semibold uppercase tracking-wide text-xs h-12" disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing Record...' : 'Confirm Registration'}
            </button>
          </div>
        </form>
    </AccessibleDialog>
  );
};

export default AddApplicantModal;
