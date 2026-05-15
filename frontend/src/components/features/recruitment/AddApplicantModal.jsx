import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { CheckCircle, X, UserPlus } from 'lucide-react';

/**
 * Add Applicant Modal
 * 
 * Simple, professional redesign for registering candidates.
 */
const AddApplicantModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => api.post('applicants/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] });
      reset();
      onClose();
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-base-200 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-base-50/50 border-b border-base-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <UserPlus className="w-4 h-4" />
             </div>
             <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-base-content">Add Applicant</h2>
                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] mt-0.5">New Candidate Record</p>
             </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle opacity-30 hover:opacity-100">
             <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">First Name</label>
              <input 
                className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
                {...register('first_name', { required: true })} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Last Name</label>
              <input 
                className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
                {...register('last_name', { required: true })} 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Position</label>
            <input 
              className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
              placeholder="e.g. Teacher I"
              {...register('position_applied', { required: true })} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Email</label>
              <input 
                type="email" 
                className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
                {...register('email', { required: true })} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Phone</label>
              <input 
                className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold" 
                {...register('phone', { required: true })} 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Initial Status</label>
            <select className="select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest" {...register('status')}>
              <option value="applied">Applied</option>
              <option value="screened">Screened</option>
              <option value="interviewed">Interviewed</option>
            </select>
          </div>

          <div className="flex gap-3 pt-6 border-t border-base-100">
            <button type="button" className="btn btn-ghost flex-1 text-[10px] font-black uppercase tracking-widest opacity-40" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddApplicantModal;
