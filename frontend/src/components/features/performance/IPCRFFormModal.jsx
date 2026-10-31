import React, { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { X, Award, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { computeRPMSScore, getAdjectivalRating } from '../../../utils/performance';

/**
 * IPCRF Form Modal (DepEd RPMS Evaluation & Portfolio Upload)
 * Conforming to DepEd Order No. 2, s. 2015 & CSC Resolution No. 1200481
 */
const IPCRFFormModal = ({ onClose, review }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = ['HR', 'SUPERINTENDENT', 'ADMINISTRATIVE'].includes(user?.role);

  const { data: employees, isLoading: loadingEmployees } = useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES],
    queryFn: async () => {
      const res = await api.get('employees/');
      return Array.isArray(res.data) ? res.data : res.data.results || [];
    },
    enabled: isAdmin && !review?.id,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      employee: review?.employee || '',
      period: review?.period || '',
      quality_score: review?.quality_score ?? '',
      behavior_score: review?.behavior_score ?? '',
      punctuality_score: review?.punctuality_score ?? '',
    },
  });

  // Watch dimension scores for live RPMS calculation
  const watchedQuality = useWatch({ control, name: 'quality_score' });
  const watchedBehavior = useWatch({ control, name: 'behavior_score' });
  const watchedPunctuality = useWatch({ control, name: 'punctuality_score' });

  const calculatedRating = useMemo(() => {
    const score = computeRPMSScore(watchedQuality, watchedBehavior, watchedPunctuality);
    const adjectival = getAdjectivalRating(score);
    const isEligible = score !== null && score >= 4.0;
    return { score, adjectival, isEligible };
  }, [watchedQuality, watchedBehavior, watchedPunctuality]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key === 'ipcrf_file' && data[key] && data[key][0]) {
          formData.append(key, data[key][0]);
        } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });

      if (review?.id) {
        return api.patch(`performance/${review.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return api.post('performance/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ipcrf-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-lg border border-slate-300 shadow-xl w-full max-w-xl overflow-hidden my-8">
        {/* Institutional Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Department of Education • SDO Lucena City
            </span>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#0038A8] shrink-0" />
              <h2 id="ipcrf-modal-title" className="text-base font-bold text-slate-900">
                {review?.id
                  ? 'Update RPMS / IPCRF Assessment'
                  : isAdmin
                  ? 'Encode RPMS / IPCRF Evaluation'
                  : 'Submit Official Signed IPCRF Portfolio'}
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              DepEd Order No. 2, s. 2015 &amp; CSC Resolution No. 1200481 Standards
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Staff Member Selection (Admin Only) */}
          {isAdmin && !review?.id && (
            <div className="space-y-1.5">
              <label htmlFor="ipcrf-employee-select" className="text-xs font-semibold text-slate-700">
                Ratee / Plantilla Employee <span className="text-red-600">*</span>
              </label>
              {loadingEmployees ? (
                <div className="h-9 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-500">
                  Loading plantilla roster...
                </div>
              ) : (
                <select
                  id="ipcrf-employee-select"
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0038A8] focus:border-[#0038A8]"
                  {...register('employee', { required: 'Employee selection is required' })}
                >
                  <option value="">Select Plantilla Personnel...</option>
                  {(Array.isArray(employees) ? employees : []).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} — {emp.position || 'Plantilla Staff'} (
                      {emp.agency_employee_no || `ID #${emp.id}`})
                    </option>
                  ))}
                </select>
              )}
              {errors.employee && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.employee.message}
                </p>
              )}
            </div>
          )}

          {/* Rating Period */}
          <div className="space-y-1.5">
            <label htmlFor="ipcrf-period-input" className="text-xs font-semibold text-slate-700">
              Evaluation Period <span className="text-red-600">*</span>
            </label>
            <input
              id="ipcrf-period-input"
              type="text"
              placeholder="e.g. SY 2024-2025 or CY 2025 Semester 1"
              className="w-full text-xs bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0038A8] focus:border-[#0038A8]"
              {...register('period', { required: 'Evaluation period is required' })}
            />
            {errors.period && (
              <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.period.message}
              </p>
            )}
          </div>

          {/* RPMS Dimension Scoring */}
          {isAdmin && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  RPMS Numerical Score Breakdown (Scale 1.0 – 5.0)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">DepEd Order No. 2, s. 2015</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Quality 40% */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                    <span>Quality</span>
                    <span className="text-slate-500 font-mono">40%</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.01"
                    placeholder="1.0 - 5.0"
                    className="w-full text-center text-xs font-mono tabular-nums font-semibold bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0038A8] focus:border-[#0038A8]"
                    {...register('quality_score', { min: 1, max: 5 })}
                  />
                </div>

                {/* Efficiency / Behavior 30% */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                    <span>Efficiency</span>
                    <span className="text-slate-500 font-mono">30%</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.01"
                    placeholder="1.0 - 5.0"
                    className="w-full text-center text-xs font-mono tabular-nums font-semibold bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0038A8] focus:border-[#0038A8]"
                    {...register('behavior_score', { min: 1, max: 5 })}
                  />
                </div>

                {/* Timeliness / Punctuality 30% */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-md border border-slate-200">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                    <span>Timeliness</span>
                    <span className="text-slate-500 font-mono">30%</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.01"
                    placeholder="1.0 - 5.0"
                    className="w-full text-center text-xs font-mono tabular-nums font-semibold bg-white border border-slate-300 rounded px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0038A8] focus:border-[#0038A8]"
                    {...register('punctuality_score', { min: 1, max: 5 })}
                  />
                </div>
              </div>

              {/* Dynamic Composite Score Summary Strip */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                    Composite RPMS Rating
                  </span>
                  <span className="font-mono tabular-nums font-bold text-base text-slate-900">
                    {calculatedRating.score !== null ? calculatedRating.score.toFixed(3) : '—'}
                  </span>
                  <span className="text-slate-500 text-[11px] ml-1">/ 5.000</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs border ${calculatedRating.adjectival.badgeClass}`}
                  >
                    {calculatedRating.adjectival.label}
                  </span>
                  <span
                    className={`inline-flex items-center text-xs px-2 py-1 rounded border font-medium ${
                      calculatedRating.isEligible
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    {calculatedRating.isEligible ? 'Promotion Eligible' : 'Standard'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Official Signed Portfolio / Form Document */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <label className="text-xs font-semibold text-slate-700 block">
              Signed IPCRF Document Portfolio (PDF or Excel)
            </label>
            <div className="border border-dashed border-slate-300 rounded-md p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col items-center justify-center text-center">
                <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                <label
                  htmlFor="ipcrf_file_input"
                  className="text-xs font-semibold text-[#0038A8] hover:underline cursor-pointer"
                >
                  Choose official IPCRF file
                </label>
                <input
                  id="ipcrf_file_input"
                  type="file"
                  accept=".pdf,.xlsx,.xls"
                  className="sr-only"
                  {...register('ipcrf_file')}
                />
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Supported formats: PDF, XLSX, XLS (Maximum 10 MB)
                </span>
              </div>
            </div>
            {review?.ipcrf_file && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200 mt-2">
                <FileText className="w-3.5 h-3.5 text-[#0038A8]" />
                <span className="truncate">Current attached file:</span>
                <a
                  href={review.ipcrf_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0038A8] font-semibold hover:underline"
                >
                  Download Existing Document
                </a>
              </div>
            )}
          </div>

          {/* Dialog Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0038A8] rounded-md hover:bg-[#002c85] transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {mutation.isPending ? 'Saving Record...' : 'Save IPCRF Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IPCRFFormModal;
