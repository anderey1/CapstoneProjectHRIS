import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { CheckCircle, X, Award, UserCheck } from 'lucide-react';

/**
 * Performance Form Modal (Staff Evaluation)
 * 
 * Simple, professional redesign for administrative ratings.
 */
const PerformanceFormModal = ({ onClose, review }) => {
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-base-200 overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-base-50/50 border-b border-base-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <UserCheck className="w-4 h-4" />
             </div>
             <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-base-content">
                   {review?.id ? 'Edit Rating' : 'Rate Staff'}
                </h2>
                <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] mt-0.5">Evaluation Record</p>
             </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle opacity-30 hover:opacity-100">
             <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Select Staff</label>
            {loadingEmployees ? (
              <div className="h-8 flex items-center"><span className="loading loading-spinner loading-xs text-primary" /></div>
            ) : (
              <select
                className="select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest"
                {...register('employee', { required: true })}
                disabled={!!review?.id}
              >
                <option value="">Choose Staff Member...</option>
                {employees?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            )}
            {errors.employee && <p className="text-error text-[9px] font-bold mt-1 uppercase tracking-tight ml-1">Staff selection required</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Period</label>
            <input
              className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold"
              placeholder="e.g. 1st Quarter 2026"
              {...register('period', { required: true })}
            />
            {errors.period && <p className="text-error text-[9px] font-bold mt-1 uppercase tracking-tight ml-1">Period required</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'punctuality_score', label: 'Punctual' },
              { id: 'quality_score', label: 'Quality' },
              { id: 'behavior_score', label: 'Behavior' }
            ].map((field) => (
              <div key={field.id} className="space-y-1.5 text-center">
                <label className="text-[9px] font-black uppercase opacity-40 tracking-widest">{field.label}</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-center text-xs font-black"
                  {...register(field.id, { required: true, min: 1, max: 5 })}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-6 border-t border-base-100">
            <button type="button" className="btn btn-ghost flex-1 text-[10px] font-black uppercase tracking-widest opacity-40" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Rating'}
            </button>
          </div>
        </form>

        {mutation.isError && (
          <div className="p-3 bg-error/5 text-error text-[9px] font-black uppercase text-center border-t border-error/10">
            Error saving record. Please try again.
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceFormModal;
