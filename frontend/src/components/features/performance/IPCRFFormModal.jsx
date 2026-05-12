import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { CheckCircle, X } from 'lucide-react';

const IPCRFFormModal = ({ onClose, review }) => {
  const queryClient = useQueryClient();
  
  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const res = await api.get('employees/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: review || {
      employee: '',
      period: '',
      punctuality_score: 5,
      quality_score: 5,
      behavior_score: 5,
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (review?.id) {
        return api.patch(`performance/${review.id}/`, data);
      }
      return api.post('performance/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERFORMANCE] });
      reset();
      onClose();
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-neutral/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-base-100 p-8 rounded-[2rem] w-full max-w-md shadow-2xl border border-base-300 relative">
        <button onClick={onClose} className="absolute right-6 top-6 btn btn-ghost btn-circle btn-sm">
            <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          {review?.id ? 'Edit IPCRF Rating' : 'New IPCRF Rating'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-xs font-bold uppercase opacity-50">Select Employee</span></label>
            {loadingEmployees ? (
              <span className="loading loading-spinner" />
            ) : (
              <select
                className="select select-bordered bg-base-200/50 rounded-xl"
                {...register('employee', { required: true })}
                disabled={!!review?.id}
              >
                <option value="">Select personnel</option>
                {(Array.isArray(employees) ? employees : [])?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            )}
            {errors.employee && <p className="text-error text-[10px] font-bold mt-1 uppercase">Personnel is required</p>}
          </div>

          <div className="form-control">
            <label className="label py-1"><span className="label-text text-xs font-bold uppercase opacity-50">Evaluation Period</span></label>
            <input
              className="input input-bordered bg-base-200/50 rounded-xl"
              placeholder="e.g., SY 2025-2026 Q1"
              {...register('period', { required: true })}
            />
            {errors.period && <p className="text-error text-[10px] font-bold mt-1 uppercase">Period is required</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['punctuality_score', 'quality_score', 'behavior_score'].map((field) => (
              <div key={field} className="form-control">
                <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase opacity-40">{field.split('_')[0]}</span></label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  className="input input-bordered bg-base-200/50 rounded-xl text-center font-black"
                  {...register(field, { required: true, min: 1, max: 5 })}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <button type="submit" className="btn btn-primary rounded-xl font-black" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <span className="loading loading-spinner" />
              ) : (
                <><CheckCircle className="w-5 h-5 mr-1" /> Save Evaluation</>
              )}
            </button>
            <button
              type="button"
              className="btn btn-ghost rounded-xl opacity-50"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IPCRFFormModal;
