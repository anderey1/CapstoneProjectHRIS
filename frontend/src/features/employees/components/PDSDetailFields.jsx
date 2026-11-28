import React, { useId } from 'react';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2, GraduationCap, Users, Award, History } from 'lucide-react';

const labelClass = 'block text-sm font-medium text-slate-800';
const inputClass = 'input input-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';
const selectClass = 'select select-bordered min-h-11 w-full rounded-lg border-slate-300 bg-white text-sm text-slate-900 focus:border-primary';

function EmptySectionNote({ text }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center text-xs text-slate-500">
      {text}
    </p>
  );
}

/**
 * PDS Detail Fields
 * Section II (Family), III (Education), IV (Eligibility), V (Work Experience)
 */
export const FamilyFields = ({ control, register, watch }) => {
  const id = useId();
  const { fields, append, remove } = useFieldArray({ control, name: 'family' });

  return (
    <section className="space-y-4" aria-labelledby={`${id}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <h3 id={`${id}-heading`} className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Users className="size-4 text-primary" aria-hidden="true" />
          <span>II. Family background</span>
        </h3>
        <button
          type="button"
          onClick={() => append({ relationship: 'CHILD', surname: '', first_name: '' })}
          className="btn btn-outline btn-sm min-h-11 gap-1.5 border-slate-300 text-slate-800 hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>Add family member</span>
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const relationship = watch(`family.${index}.relationship`);
          const isChild = relationship === 'CHILD';
          const rowId = (name) => `${id}-family-${index}-${name}`;

          return (
            <div key={field.id} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">Member #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove family member #${index + 1}`}
                  className="btn btn-ghost btn-square min-h-11 min-w-11 text-error hover:bg-red-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('relationship')} className={labelClass}>Relationship</label>
                  <select id={rowId('relationship')} {...register(`family.${index}.relationship`)} className={selectClass}>
                    <option value="SPOUSE">Spouse</option>
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="CHILD">Child</option>
                  </select>
                </div>

                {isChild ? (
                  <div className="min-w-0 space-y-1.5">
                    <label htmlFor={rowId('full_name')} className={labelClass}>Child full name</label>
                    <input
                      id={rowId('full_name')}
                      {...register(`family.${index}.full_name`)}
                      placeholder="Full name as written in PDS"
                      className={inputClass}
                    />
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 space-y-1.5">
                      <label htmlFor={rowId('surname')} className={labelClass}>Surname</label>
                      <input id={rowId('surname')} {...register(`family.${index}.surname`)} className={inputClass} />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <label htmlFor={rowId('first_name')} className={labelClass}>First name</label>
                      <input id={rowId('first_name')} {...register(`family.${index}.first_name`)} className={inputClass} />
                    </div>
                  </>
                )}

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('occupation')} className={labelClass}>Occupation</label>
                  <input
                    id={rowId('occupation')}
                    {...register(`family.${index}.occupation`)}
                    placeholder="Occupation or school"
                    className={inputClass}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('dob')} className={labelClass}>Date of birth</label>
                  <input
                    id={rowId('dob')}
                    type="date"
                    {...register(`family.${index}.date_of_birth`)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {fields.length === 0 && <EmptySectionNote text="No family records added yet." />}
      </div>
    </section>
  );
};

export const EducationFields = ({ control, register, watch }) => {
  const id = useId();
  const { fields, append, remove } = useFieldArray({ control, name: 'education' });

  return (
    <section className="space-y-4" aria-labelledby={`${id}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <h3 id={`${id}-heading`} className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <GraduationCap className="size-4 text-primary" aria-hidden="true" />
          <span>III. Educational background</span>
        </h3>
        <button
          type="button"
          onClick={() => append({ level: 'COLLEGE', school_name: '', degree_course: '' })}
          className="btn btn-outline btn-sm min-h-11 gap-1.5 border-slate-300 text-slate-800 hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>Add education</span>
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const rowId = (name) => `${id}-edu-${index}-${name}`;
          const level = watch(`education.${index}.level`);

          return (
            <div key={field.id} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">{level || `Education #${index + 1}`}</span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove education #${index + 1}`}
                  className="btn btn-ghost btn-square min-h-11 min-w-11 text-error hover:bg-red-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('level')} className={labelClass}>Level</label>
                  <select id={rowId('level')} {...register(`education.${index}.level`)} className={selectClass}>
                    <option value="ELEMENTARY">Elementary</option>
                    <option value="SECONDARY">Secondary</option>
                    <option value="VOCATIONAL">Vocational</option>
                    <option value="COLLEGE">College</option>
                    <option value="GRADUATE">Graduate</option>
                  </select>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('school_name')} className={labelClass}>School name</label>
                  <input
                    id={rowId('school_name')}
                    {...register(`education.${index}.school_name`)}
                    placeholder="Name of school"
                    className={inputClass}
                  />
                </div>

                <div className="min-w-0 space-y-1.5 sm:col-span-2">
                  <label htmlFor={rowId('degree_course')} className={labelClass}>Basic education / Degree / Course</label>
                  <input
                    id={rowId('degree_course')}
                    {...register(`education.${index}.degree_course`)}
                    placeholder="Degree or course"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('period_from')} className={labelClass}>From</label>
                  <input
                    id={rowId('period_from')}
                    type="date"
                    {...register(`education.${index}.period_from`)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('period_to')} className={labelClass}>To</label>
                  <input
                    id={rowId('period_to')}
                    {...register(`education.${index}.period_to`)}
                    placeholder="YYYY-MM-DD or present"
                    className={`${inputClass} tabular-nums`}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('year_graduated')} className={labelClass}>Year graduated</label>
                  <input
                    id={rowId('year_graduated')}
                    {...register(`education.${index}.year_graduated`)}
                    placeholder="YYYY"
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {fields.length === 0 && <EmptySectionNote text="No education records added yet." />}
      </div>
    </section>
  );
};

export const EligibilityFields = ({ control, register }) => {
  const id = useId();
  const { fields, append, remove } = useFieldArray({ control, name: 'eligibilities' });

  return (
    <section className="space-y-4" aria-labelledby={`${id}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <h3 id={`${id}-heading`} className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Award className="size-4 text-primary" aria-hidden="true" />
          <span>IV. Civil service eligibility</span>
        </h3>
        <button
          type="button"
          onClick={() => append({ service: '', rating: '' })}
          className="btn btn-outline btn-sm min-h-11 gap-1.5 border-slate-300 text-slate-800 hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>Add eligibility</span>
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const rowId = (name) => `${id}-elig-${index}-${name}`;

          return (
            <div key={field.id} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">Eligibility #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove eligibility #${index + 1}`}
                  className="btn btn-ghost btn-square min-h-11 min-w-11 text-error hover:bg-red-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="min-w-0 space-y-1.5 sm:col-span-2">
                  <label htmlFor={rowId('service')} className={labelClass}>Career service / Examination</label>
                  <input
                    id={rowId('service')}
                    {...register(`eligibilities.${index}.service`)}
                    placeholder="e.g. Licensure Examination for Teachers"
                    className={inputClass}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('rating')} className={labelClass}>Rating</label>
                  <input
                    id={rowId('rating')}
                    {...register(`eligibilities.${index}.rating`)}
                    placeholder="e.g. 84.50%"
                    className={`${inputClass} tabular-nums`}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('date_of_exam')} className={labelClass}>Date of examination</label>
                  <input
                    id={rowId('date_of_exam')}
                    type="date"
                    {...register(`eligibilities.${index}.date_of_exam`)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>
              </div>
            </div>
          );
        })}
        {fields.length === 0 && <EmptySectionNote text="No eligibility records added yet." />}
      </div>
    </section>
  );
};

export const WorkHistoryFields = ({ control, register }) => {
  const id = useId();
  const { fields, append, remove } = useFieldArray({ control, name: 'work_experience' });

  return (
    <section className="space-y-4" aria-labelledby={`${id}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <h3 id={`${id}-heading`} className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <History className="size-4 text-primary" aria-hidden="true" />
          <span>V. Work experience</span>
        </h3>
        <button
          type="button"
          onClick={() => append({ position_title: '', agency: '', is_gov_service: true })}
          className="btn btn-outline btn-sm min-h-11 gap-1.5 border-slate-300 text-slate-800 hover:border-primary hover:text-primary"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>Add experience</span>
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const rowId = (name) => `${id}-work-${index}-${name}`;

          return (
            <div key={field.id} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600">Position #{index + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove work experience #${index + 1}`}
                  className="btn btn-ghost btn-square min-h-11 min-w-11 text-error hover:bg-red-50"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('position_title')} className={labelClass}>Position title</label>
                  <input
                    id={rowId('position_title')}
                    {...register(`work_experience.${index}.position_title`)}
                    className={inputClass}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('agency')} className={labelClass}>Department / Agency / Company</label>
                  <input
                    id={rowId('agency')}
                    {...register(`work_experience.${index}.agency`)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('date_from')} className={labelClass}>From</label>
                  <input
                    id={rowId('date_from')}
                    type="date"
                    {...register(`work_experience.${index}.date_from`)}
                    className={`${inputClass} tabular-nums`}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('date_to')} className={labelClass}>To</label>
                  <input
                    id={rowId('date_to')}
                    {...register(`work_experience.${index}.date_to`)}
                    placeholder="YYYY-MM-DD or present"
                    className={`${inputClass} tabular-nums`}
                  />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <label htmlFor={rowId('is_gov_service')} className={labelClass}>Government service</label>
                  <select id={rowId('is_gov_service')} {...register(`work_experience.${index}.is_gov_service`)} className={selectClass}>
                    <option value={true}>Yes</option>
                    <option value={false}>No</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
        {fields.length === 0 && <EmptySectionNote text="No work experience records added yet." />}
      </div>
    </section>
  );
};
