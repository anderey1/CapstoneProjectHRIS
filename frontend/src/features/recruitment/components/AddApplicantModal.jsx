import React, { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, AlertCircle, Check } from 'lucide-react';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { useToast } from '../../../context/ToastContext';
import AccessibleDialog from '../../../components/common/AccessibleDialog';

const labelRowClass = 'flex items-center justify-between gap-2 text-sm font-medium text-slate-800';
const inputClass = 'input input-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';
const selectClass = 'select select-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';

function FieldError({ id, error }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="flex items-center gap-1.5 text-xs font-medium text-error">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{error.message}</span>
    </p>
  );
}

/**
 * Encode Applicant Profile Modal — DepEd Order No. 007, s. 2023
 */
const AddApplicantModal = ({ onClose }) => {
  const id = useId();
  const fieldId = (name) => `${id}-${name}`;
  const queryClient = useQueryClient();
  const toast = useToast();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    resetField,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      phone: '',
      position_applied: '',
      school_division: 'Lucena City',
    },
  });

  const resumeFile = watch('resume')?.[0];

  const mutation = useMutation({
    mutationFn: (formData) =>
      api.post('applicants/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.APPLICANTS] });
      toast.success('Applicant profile encoded.');
      reset();
      onClose();
    },
    onError: (err) => {
      const errData = err.response?.data;
      if (typeof errData === 'string') {
        setSubmitError(errData);
      } else if (errData?.detail) {
        setSubmitError(errData.detail);
      } else if (errData && typeof errData === 'object') {
        const msg = Object.entries(errData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' | ');
        setSubmitError(msg || 'Failed to encode applicant profile.');
      } else {
        setSubmitError('Unable to reach the server. Please try again.');
      }
    },
  });

  const onSubmit = (data) => {
    setSubmitError(null);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'resume') {
        if (value?.[0]) formData.append('resume', value[0]);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    mutation.mutate(formData);
  };

  const closeModal = () => {
    if (!mutation.isPending) onClose();
  };

  const formId = `${id}-form`;

  return (
    <AccessibleDialog
      onClose={closeModal}
      labelledBy={fieldId('title')}
      describedBy={fieldId('subtitle')}
      noBackdropClose={mutation.isPending}
      className="flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-0 shadow-xl sm:max-h-[90dvh]"
    >
      {/* Sticky Header */}
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">DepEd Order No. 007, s. 2023</p>
          <h2 id={fieldId('title')} className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900">
            Add applicant
          </h2>
          <p id={fieldId('subtitle')} className="mt-0.5 text-xs text-slate-600">
            Add a walk-in or manual applicant to the RQA/CAR list.
          </p>
        </div>
        <button
          type="button"
          onClick={closeModal}
          disabled={mutation.isPending}
          className="btn btn-ghost btn-square min-h-11 min-w-11 shrink-0 text-slate-600 hover:text-slate-900"
          aria-label="Close applicant dialog"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </header>

      {/* Scrollable Body */}
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain bg-white px-5 py-5 sm:px-6"
        noValidate
      >
        {submitError && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-error" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-red-900">Could not save applicant</p>
              <p className="mt-1 break-words text-sm text-red-800">{submitError}</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss save error"
              onClick={() => setSubmitError(null)}
              className="btn btn-ghost btn-square min-h-11 min-w-11 shrink-0 text-error"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* 1. Applicant Identity */}
        <section className="space-y-4" aria-labelledby={fieldId('identity-heading')}>
          <div className="border-b border-slate-200 pb-2">
            <h3 id={fieldId('identity-heading')} className="text-sm font-semibold text-slate-900">
              1. Applicant identity
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('first_name')} className={labelRowClass}>
                <span>First name</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <input
                id={fieldId('first_name')}
                type="text"
                placeholder="Given name"
                aria-invalid={Boolean(errors.first_name)}
                aria-describedby={errors.first_name ? fieldId('first_name-error') : undefined}
                className={`${inputClass} ${errors.first_name ? 'border-error' : ''}`}
                {...register('first_name', { required: 'First name is required' })}
              />
              <FieldError id={fieldId('first_name-error')} error={errors.first_name} />
            </div>

            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('middle_name')} className={labelRowClass}>
                <span>Middle name</span>
                <span className="text-xs font-normal text-slate-500">Optional</span>
              </label>
              <input
                id={fieldId('middle_name')}
                type="text"
                placeholder="Middle name"
                className={inputClass}
                {...register('middle_name')}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('last_name')} className={labelRowClass}>
                <span>Last name</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <input
                id={fieldId('last_name')}
                type="text"
                placeholder="Family name"
                aria-invalid={Boolean(errors.last_name)}
                aria-describedby={errors.last_name ? fieldId('last_name-error') : undefined}
                className={`${inputClass} ${errors.last_name ? 'border-error' : ''}`}
                {...register('last_name', { required: 'Last name is required' })}
              />
              <FieldError id={fieldId('last_name-error')} error={errors.last_name} />
            </div>
          </div>
        </section>

        {/* 2. Contact Information */}
        <section className="space-y-4" aria-labelledby={fieldId('contact-heading')}>
          <div className="border-b border-slate-200 pb-2">
            <h3 id={fieldId('contact-heading')} className="text-sm font-semibold text-slate-900">
              2. Contact information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('email')} className={labelRowClass}>
                <span>Email address</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <input
                id={fieldId('email')}
                type="email"
                placeholder="applicant@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? fieldId('email-error') : undefined}
                className={`${inputClass} ${errors.email ? 'border-error' : ''}`}
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              <FieldError id={fieldId('email-error')} error={errors.email} />
            </div>

            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('phone')} className={labelRowClass}>
                <span>Mobile phone</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <input
                id={fieldId('phone')}
                type="tel"
                placeholder="09XX XXX XXXX"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? fieldId('phone-error') : undefined}
                className={`${inputClass} tabular-nums ${errors.phone ? 'border-error' : ''}`}
                {...register('phone', { required: 'Mobile phone is required' })}
              />
              <FieldError id={fieldId('phone-error')} error={errors.phone} />
            </div>
          </div>
        </section>

        {/* 3. Position & Attachment */}
        <section className="space-y-4" aria-labelledby={fieldId('position-heading')}>
          <div className="border-b border-slate-200 pb-2">
            <h3 id={fieldId('position-heading')} className="text-sm font-semibold text-slate-900">
              3. Position and supporting resume
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('position_applied')} className={labelRowClass}>
                <span>Position applied</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <select
                id={fieldId('position_applied')}
                aria-invalid={Boolean(errors.position_applied)}
                aria-describedby={errors.position_applied ? fieldId('position-error') : undefined}
                className={`${selectClass} ${errors.position_applied ? 'border-error' : ''}`}
                {...register('position_applied', { required: 'Position applied is required' })}
              >
                <option value="">Select position</option>
                <optgroup label="Teaching positions">
                  <option value="Teacher I">Teacher I</option>
                  <option value="Teacher II">Teacher II</option>
                  <option value="Teacher III">Teacher III</option>
                  <option value="Master Teacher I">Master Teacher I</option>
                  <option value="Master Teacher II">Master Teacher II</option>
                  <option value="SPED Teacher I">SPED Teacher I</option>
                </optgroup>
                <optgroup label="Non-teaching positions">
                  <option value="Administrative Officer I">Administrative Officer I</option>
                  <option value="Administrative Officer II">Administrative Officer II</option>
                  <option value="Administrative Assistant I">Administrative Assistant I</option>
                  <option value="Administrative Assistant II">Administrative Assistant II</option>
                  <option value="Registrar I">Registrar I</option>
                  <option value="Accountant I">Accountant I</option>
                  <option value="School Principal I">School Principal I</option>
                </optgroup>
              </select>
              <FieldError id={fieldId('position-error')} error={errors.position_applied} />
            </div>

            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('school_division')} className={labelRowClass}>
                <span>Schools division</span>
                <span className="text-xs font-normal text-slate-500">Optional</span>
              </label>
              <input
                id={fieldId('school_division')}
                type="text"
                className={inputClass}
                {...register('school_division')}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
            <label htmlFor={fieldId('resume')} className={labelRowClass}>
              <span>Resume / CV</span>
              <span className="text-xs font-normal text-slate-500">Optional · PDF, DOC, DOCX</span>
            </label>
            <input
              id={fieldId('resume')}
              type="file"
              accept=".pdf,.doc,.docx"
              className="file-input file-input-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm"
              {...register('resume')}
            />
            {resumeFile ? (
              <div className="flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs">
                <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                <FileText className="size-4 shrink-0 text-slate-500" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800" title={resumeFile.name}>
                  {resumeFile.name} ({Math.max(1, Math.round(resumeFile.size / 1024))} KB)
                </span>
                <button
                  type="button"
                  aria-label="Remove resume attachment"
                  onClick={() => resetField('resume')}
                  className="btn btn-ghost btn-square min-h-11 min-w-11 shrink-0 text-slate-600 hover:text-error"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Upload className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Attach a scanned resume or CV if available during manual encoding.</span>
              </p>
            )}
          </div>
        </section>
      </form>

      {/* Sticky Footer */}
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:px-6">
        <p className="text-xs text-slate-600">New entries start at Applied / Submitted.</p>
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            className="btn btn-ghost min-h-11 text-sm font-medium text-slate-700"
            onClick={closeModal}
            disabled={mutation.isPending}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className="btn btn-primary min-h-11 px-5 text-sm font-semibold"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save applicant profile'}
          </button>
        </div>
      </footer>
    </AccessibleDialog>
  );
};

export default AddApplicantModal;
