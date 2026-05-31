import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { X, UserPlus, Upload, FileText } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <div className="bg-white rounded-xl w-full max-w-xl shadow-2xl border border-base-200 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-base-50/50 border-b border-base-100 p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner border border-primary/5">
                <UserPlus className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-base-content leading-none">Register Applicant</h2>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mt-2">New Recruitment Entry</p>
             </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle opacity-30 hover:opacity-100">
             <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">First Name</label>
              <input 
                className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold h-11" 
                {...register('first_name', { required: true })} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Last Name</label>
              <input 
                className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold h-11" 
                {...register('last_name', { required: true })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Position Applied</label>
              <select 
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
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Division</label>
              <input 
                className="input input-bordered w-full bg-base-50 border-base-200 rounded-lg text-xs font-bold h-11" 
                defaultValue="Lucena City"
                {...register('school_division')} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Email Address</label>
              <input 
                type="email" 
                className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold h-11" 
                {...register('email', { required: true })} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Mobile Phone</label>
              <input 
                className="input input-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-lg text-xs font-bold h-11" 
                {...register('phone', { required: true })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Attach Resume / CV</label>
               <div className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-4 transition-all h-24 flex items-center justify-center ${resumeFile?.[0] ? 'border-success/30 bg-success/5' : 'border-base-200 hover:border-primary/40 bg-base-50'}`}>
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    {...register('resume')}
                  />
                  <div className="flex flex-col items-center gap-1">
                    {resumeFile?.[0] ? (
                        <>
                           <FileText className="w-5 h-5 text-success" />
                           <span className="text-[9px] font-black text-success uppercase truncate max-w-[150px]">{resumeFile[0].name}</span>
                        </>
                    ) : (
                        <>
                           <Upload className="w-5 h-5 text-primary opacity-30 group-hover:opacity-100 transition-opacity" />
                           <span className="text-[9px] font-black opacity-30 uppercase tracking-widest group-hover:opacity-100">Upload PDF</span>
                        </>
                    )}
                  </div>
               </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Initial Pipeline Stage</label>
              <select className="select select-bordered w-full bg-base-50 border-base-200 focus:border-primary rounded-xl text-[10px] font-black uppercase tracking-widest h-24" {...register('status')}>
                <option value="applied">Applied / Submitted</option>
                <option value="initial_evaluation">Initial QS Evaluation</option>
                <option value="comparative_assessment">Comparative Assessment</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-base-100">
            <button type="button" className="btn btn-ghost flex-1 text-xs font-black uppercase tracking-widest opacity-40 h-12" onClick={onClose}>Discard</button>
            <button type="submit" className="btn btn-primary flex-[2] rounded-xl font-black uppercase tracking-[0.2em] text-xs h-12 shadow-lg shadow-primary/20" disabled={mutation.isPending}>
              {mutation.isPending ? 'Processing Record...' : 'Confirm Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddApplicantModal;
