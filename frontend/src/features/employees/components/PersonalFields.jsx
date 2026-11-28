import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';

const labelRowClass = 'flex items-center justify-between gap-2 text-sm font-medium text-slate-800';
const inputClass = 'input input-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';
const selectClass = 'select select-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';
const textareaClass = 'textarea textarea-bordered min-h-22 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary leading-relaxed';

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
 * Personal Info Fields (CS Form 212 Section I + Contact, Account, IDs, Signature)
 */
const PersonalFields = ({ isEdit, register, errors, watch }) => {
  const id = useId();
  const fieldId = (name) => `${id}-${name}`;
  const signaturePreview = watch('e_signature_preview');

  return (
    <div className="space-y-7">
      {/* 1. Identity */}
      <section className="space-y-4" aria-labelledby={fieldId('identity-heading')}>
        <div className="border-b border-slate-200 pb-2">
          <h3 id={fieldId('identity-heading')} className="text-sm font-semibold text-slate-900">
            1. Personal identity
          </h3>
          <p className="text-xs text-slate-500">Legal name and birth details as recorded in CSC Form No. 212.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('first_name')} className={labelRowClass}>
              <span>First name</span>
              <span className="text-xs font-medium text-primary">Required</span>
            </label>
            <input
              id={fieldId('first_name')}
              {...register('first_name', { required: 'First name is required' })}
              type="text"
              placeholder="Given name"
              aria-invalid={Boolean(errors.first_name)}
              aria-describedby={errors.first_name ? fieldId('first_name-error') : undefined}
              className={`${inputClass} ${errors.first_name ? 'border-error' : ''}`}
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
              {...register('middle_name')}
              type="text"
              placeholder="Middle name"
              className={inputClass}
            />
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('last_name')} className={labelRowClass}>
              <span>Last name</span>
              <span className="text-xs font-medium text-primary">Required</span>
            </label>
            <input
              id={fieldId('last_name')}
              {...register('last_name', { required: 'Last name is required' })}
              type="text"
              placeholder="Family name"
              aria-invalid={Boolean(errors.last_name)}
              aria-describedby={errors.last_name ? fieldId('last_name-error') : undefined}
              className={`${inputClass} ${errors.last_name ? 'border-error' : ''}`}
            />
            <FieldError id={fieldId('last_name-error')} error={errors.last_name} />
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('name_extension')} className={labelRowClass}>
              <span>Extension</span>
              <span className="text-xs font-normal text-slate-500">Optional</span>
            </label>
            <input
              id={fieldId('name_extension')}
              {...register('name_extension')}
              type="text"
              placeholder="e.g. Jr., III"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('date_of_birth')} className={labelRowClass}>
              <span>Date of birth</span>
            </label>
            <input
              id={fieldId('date_of_birth')}
              {...register('date_of_birth')}
              type="date"
              className={`${inputClass} tabular-nums`}
            />
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('place_of_birth')} className={labelRowClass}>
              <span>Place of birth</span>
            </label>
            <input
              id={fieldId('place_of_birth')}
              {...register('place_of_birth')}
              type="text"
              placeholder="City or municipality"
              className={inputClass}
            />
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('sex')} className={labelRowClass}>
              <span>Sex</span>
            </label>
            <select id={fieldId('sex')} {...register('sex')} className={selectClass}>
              <option value="">Select sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('civil_status')} className={labelRowClass}>
              <span>Civil status</span>
            </label>
            <select id={fieldId('civil_status')} {...register('civil_status')} className={selectClass}>
              <option value="">Select civil status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
          </div>
        </div>
      </section>

      {/* 2. Contact & Portal Account */}
      <section className="space-y-4" aria-labelledby={fieldId('contact-heading')}>
        <div className="border-b border-slate-200 pb-2">
          <h3 id={fieldId('contact-heading')} className="text-sm font-semibold text-slate-900">
            {isEdit ? '2. Contact and address' : '2. Contact and portal account'}
          </h3>
          {!isEdit && (
            <p className="text-xs text-slate-500">
              Account credentials send a 24-hour password setup link to the employee email.
            </p>
          )}
        </div>

        {!isEdit && (
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('username')} className={labelRowClass}>
                <span>Username</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <input
                id={fieldId('username')}
                {...register('username', { required: 'Username is required' })}
                type="text"
                placeholder="e.g. jdelacruz"
                aria-invalid={Boolean(errors.username)}
                aria-describedby={errors.username ? fieldId('username-error') : undefined}
                className={`${inputClass} ${errors.username ? 'border-error' : ''}`}
              />
              <FieldError id={fieldId('username-error')} error={errors.username} />
            </div>

            <div className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId('email')} className={labelRowClass}>
                <span>Email address</span>
                <span className="text-xs font-medium text-primary">Required</span>
              </label>
              <input
                id={fieldId('email')}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Enter a valid email address',
                  },
                })}
                type="email"
                placeholder="name@deped.gov.ph"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? fieldId('email-error') : undefined}
                className={`${inputClass} ${errors.email ? 'border-error' : ''}`}
              />
              <FieldError id={fieldId('email-error')} error={errors.email} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-1.5">
            <label htmlFor={fieldId('mobile_no')} className={labelRowClass}>
              <span>Mobile number</span>
              <span className="text-xs font-normal text-slate-500">Optional</span>
            </label>
            <input
              id={fieldId('mobile_no')}
              {...register('mobile_no')}
              type="tel"
              placeholder="09XX XXX XXXX"
              className={`${inputClass} tabular-nums`}
            />
          </div>

          <div className="min-w-0 space-y-1.5 sm:col-span-2">
            <label htmlFor={fieldId('residential_address')} className={labelRowClass}>
              <span>Residential address</span>
              <span className="text-xs font-normal text-slate-500">Optional</span>
            </label>
            <textarea
              id={fieldId('residential_address')}
              {...register('residential_address')}
              rows={2}
              placeholder="House/Lot No., Street, Barangay, City/Municipality, Province"
              className={textareaClass}
            />
          </div>
        </div>
      </section>

      {/* 3. Government IDs */}
      <section className="space-y-4" aria-labelledby={fieldId('ids-heading')}>
        <div className="border-b border-slate-200 pb-2">
          <h3 id={fieldId('ids-heading')} className="text-sm font-semibold text-slate-900">
            3. Government identifiers
          </h3>
          <p className="text-xs text-slate-500">Optional during encoding; used in payroll, GSIS, and CSC reports.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[
            { label: 'Agency employee no.', name: 'agency_employee_no' },
            { label: 'TIN', name: 'tin_no' },
            { label: 'PhilHealth no.', name: 'philhealth_no' },
            { label: 'Pag-IBIG ID', name: 'pagibig_id' },
            { label: 'UMID ID', name: 'umid_id' },
            { label: 'PhilSys ID (PSN)', name: 'philsys_id' },
          ].map((item) => (
            <div key={item.name} className="min-w-0 space-y-1.5">
              <label htmlFor={fieldId(item.name)} className={labelRowClass}>
                <span>{item.label}</span>
              </label>
              <input
                id={fieldId(item.name)}
                {...register(item.name)}
                type="text"
                className={`${inputClass} font-mono tabular-nums`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 4. Digital Signature */}
      <section className="space-y-4" aria-labelledby={fieldId('sig-heading')}>
        <div className="border-b border-slate-200 pb-2">
          <h3 id={fieldId('sig-heading')} className="text-sm font-semibold text-slate-900">
            4. Digital signature
          </h3>
          <p className="text-xs text-slate-500">PNG with a transparent background works best on CSC forms.</p>
        </div>

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          {isEdit && signaturePreview && (
            <div className="flex h-16 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1.5">
              <img src={signaturePreview} alt="Current employee signature" className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1.5 w-full">
            <label htmlFor={fieldId('e_signature_file')} className={labelRowClass}>
              <span>{isEdit && signaturePreview ? 'Replace signature image' : 'Upload signature image'}</span>
              <span className="text-xs font-normal text-slate-500">Optional</span>
            </label>
            <input
              id={fieldId('e_signature_file')}
              {...register('e_signature_file')}
              type="file"
              accept="image/*"
              className="file-input file-input-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default PersonalFields;
