import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { CheckCircle, X, Award, User, Upload } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

/**
 * IPCRF Form Modal (Performance Rating & Upload)
 * 
 * Simple, professional redesign for administrative ratings or employee uploads.
 */
const IPCRFFormModal = ({ onClose, review }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = ['ADMIN', 'HR', 'SUPERINTENDENT'].includes(user?.role);

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const res = await api.get('employees/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
    enabled: isAdmin && !review?.id
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: review || {
      employee: '',
      period: '',
      punctuality_score: '',
      quality_score: '',
      behavior_score: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'ipcrf_file' && data[key] && data[key][0]) {
          formData.append(key, data[key][0]);
        } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });

      if (review?.id) {
        return api.patch(`performance/${review.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      return api.post('performance/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-base-content">
                {review?.id ? 'Edit Rating' : (isAdmin ? 'Rate Staff' : 'Upload IPCRF')}
              </h2>
              <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em] mt-0.5">Performance Evaluation</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle opacity-30 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {isAdmin && !review?.id && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Select Staff</label>
              {loadingEmployees ? (
                <div className="h-8 flex items-center"><span className="loading loading-spinner loading-xs text-primary" /></div>
              ) : (
                <select
                  className="select select-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-[10px] font-black uppercase tracking-widest"
                  {...register('employee', { required: isAdmin })}
                >
                  <option value="">Choose Staff Member...</option>
                  {(Array.isArray(employees) ? employees : [])?.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              )}
              {errors.employee && <p className="text-error text-[9px] font-bold mt-1 uppercase tracking-tight ml-1">Staff selection required</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Period</label>
            <input
              className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-xs font-bold"
              placeholder="e.g. SY 2025-2026 Q1"
              {...register('period', { required: true })}
            />
            {errors.period && <p className="text-error text-[9px] font-bold mt-1 uppercase tracking-tight ml-1">Period required</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">IPCRF Document (Excel/PDF)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-base-200 border-dashed rounded-lg cursor-pointer bg-base-50 hover:bg-base-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 mb-2 text-primary opacity-40" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Click to upload file</p>
                </div>
                <input type="file" className="hidden" {...register('ipcrf_file')} />
              </label>
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-4">
              <div className="divider text-[9px] font-black uppercase opacity-20 tracking-[0.3em]">OR SET SCORES</div>
              <div className="grid grid-cols-3 gap-4">
                {['punctuality', 'quality', 'behavior'].map((field) => (
                  <div key={field} className="space-y-1.5 text-center">
                    <label className="text-[9px] font-black uppercase opacity-40 tracking-widest">{field}</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      className="input input-sm w-full bg-base-50 border-base-100 focus:border-primary rounded-lg text-center text-xs font-black"
                      {...register(`${field}_score`, { min: 1, max: 5 })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-base-100">
            <button type="button" className="btn btn-ghost flex-1 text-[10px] font-black uppercase tracking-widest opacity-40" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary/20" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Performance Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IPCRFFormModal;
