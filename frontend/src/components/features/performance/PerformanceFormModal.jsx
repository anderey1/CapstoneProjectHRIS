import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { CheckCircle, XCircle } from 'lucide-react';

const PerformanceFormModal = ({ onClose, review }) => {
  const queryClient = useQueryClient();
  
  // Fetch employees for selection
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-base-300 overflow-hidden">
        {/* Header: Solid & Professional */}
        <div className="bg-base-100 border-b border-base-200 p-6">
          <h3 className="font-bold text-xl text-base-content">
            {review?.id ? 'Edit Performance Review' : 'New Performance Review'}
          </h3>
          <p className="text-xs opacity-50 mt-1">Rate the personnel's performance for the specified period.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Employee</label>
            {loadingEmployees ? (
              <div className="h-12 flex items-center justify-center bg-base-100 rounded-lg">
                <span className="loading loading-spinner loading-sm" />
              </div>
            ) : (
              <select
                className="select select-bordered w-full bg-base-100 rounded-lg font-medium"
                {...register('employee', { required: true })}
                disabled={!!review?.id}
              >
                <option value="">Select Personnel...</option>
                {employees?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            )}
            {errors.employee && <p className="text-error text-[10px] font-bold mt-1 uppercase tracking-wider">Please select an employee</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Review Period</label>
            <input
              className="input input-bordered w-full bg-base-100 rounded-lg"
              placeholder="e.g. 1st Quarter 2026"
              {...register('period', { required: true })}
            />
            {errors.period && <p className="text-error text-[10px] font-bold mt-1 uppercase tracking-wider">Required field</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'punctuality_score', label: 'Punctuality' },
              { id: 'quality_score', label: 'Quality' },
              { id: 'behavior_score', label: 'Behavior' }
            ].map((field) => (
              <div key={field.id}>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">{field.label}</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="input input-bordered w-full bg-base-100 rounded-lg text-center font-bold"
                  {...register(field.id, { required: true, min: 1, max: 5 })}
                />
              </div>
            ))}
          </div>

          <div className="modal-action mt-8 pt-4 border-t border-base-200 bg-base-50 p-6 -mx-8 -mb-8">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary px-10" 
              disabled={mutation.isLoading}
            >
              {mutation.isLoading ? (
                <span className="loading loading-spinner" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1 inline" />
              )}
              {review?.id ? 'Update Review' : 'Submit Review'}
            </button>
          </div>
        </form>
        {mutation.isError && (
          <div className="p-4 bg-error/10 text-error text-xs font-bold text-center">
            Error saving review. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceFormModal;
