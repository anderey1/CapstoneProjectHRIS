import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { CheckCircle } from 'lucide-react';

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
    <div className="fixed inset-0 bg-base-200/70 flex items-center justify-center z-50">
      <div className="bg-base-100 p-6 rounded-xl w-full max-w-md shadow-lg border border-base-300">
        <h2 className="text-xl font-bold mb-4 text-primary">Add New Applicant</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold opacity-50 uppercase mb-1">First Name</label>
              <input className="input input-bordered w-full" {...register('first_name', { required: true })} />
            </div>
            <div>
              <label className="block text-xs font-bold opacity-50 uppercase mb-1">Last Name</label>
              <input className="input input-bordered w-full" {...register('last_name', { required: true })} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold opacity-50 uppercase mb-1">Position Applied</label>
            <input className="input input-bordered w-full" {...register('position_applied', { required: true })} />
          </div>

          <div>
            <label className="block text-xs font-bold opacity-50 uppercase mb-1">Email</label>
            <input type="email" className="input input-bordered w-full" {...register('email', { required: true })} />
          </div>

          <div>
            <label className="block text-xs font-bold opacity-50 uppercase mb-1">Phone</label>
            <input className="input input-bordered w-full" {...register('phone', { required: true })} />
          </div>

          <div>
            <label className="block text-xs font-bold opacity-50 uppercase mb-1">Initial Status</label>
            <select className="select select-bordered w-full" {...register('status')}>
              <option value="applied">Applied</option>
              <option value="screened">Screened</option>
              <option value="interviewed">Interviewed</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <span className="loading loading-spinner" /> : <CheckCircle className="w-4 h-4 mr-1" />}
              Save Applicant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddApplicantModal;
