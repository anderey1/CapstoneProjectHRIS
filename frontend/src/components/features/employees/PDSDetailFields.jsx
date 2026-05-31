import React from 'react';
import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2, GraduationCap, Users, Award, History } from 'lucide-react';

/**
 * PDS Detail Fields
 * 
 * Handles Section II (Family), III (Education), IV (Eligibility), and V (Work Exp)
 * using useFieldArray for dynamic lists.
 */
export const FamilyFields = ({ control, register, errors, watch }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "family"
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-base-100 pb-2">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> II. Family Background
        </h4>
        <button 
          type="button" 
          onClick={() => append({ relationship: 'CHILD', surname: '', first_name: '' })}
          className="btn btn-ghost btn-xs text-primary font-black uppercase tracking-widest"
        >
          <Plus className="w-3 h-3 mr-1" /> Add Member
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const relationship = watch(`family.${index}.relationship`);
          const isChild = relationship === 'CHILD';

          return (
            <div key={field.id} className="p-4 bg-base-50 rounded-xl border border-base-100 space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Member #{index + 1}</span>
                 <button type="button" onClick={() => remove(index)} className="btn btn-ghost btn-xs text-error">
                   <Trash2 className="w-3 h-3" />
                 </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Relationship</label>
                  <select 
                    {...register(`family.${index}.relationship`)}
                    className="select select-sm select-bordered w-full text-[10px] font-bold"
                  >
                    <option value="SPOUSE">Spouse</option>
                    <option value="FATHER">Father</option>
                    <option value="MOTHER">Mother</option>
                    <option value="CHILD">Child</option>
                  </select>
                </div>

                {isChild ? (
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Name of Child (Full Name)</label>
                    <input 
                      {...register(`family.${index}.full_name`)} 
                      placeholder="Enter literal full name as written in PDS" 
                      className="input input-sm input-bordered w-full text-[11px] font-bold" 
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Surname</label>
                      <input {...register(`family.${index}.surname`)} className="input input-sm input-bordered w-full text-[11px] font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest opacity-40">First Name</label>
                      <input {...register(`family.${index}.first_name`)} className="input input-sm input-bordered w-full text-[11px] font-bold" />
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Occupation / B-day</label>
                  <input {...register(`family.${index}.occupation`)} placeholder="Occupation" className="input input-sm input-bordered w-full text-[10px] font-bold mb-1" />
                  <input type="date" {...register(`family.${index}.date_of_birth`)} className="input input-sm input-bordered w-full text-[10px] font-bold" />
                </div>
              </div>
            </div>
          );
        })}
        {fields.length === 0 && (
          <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest opacity-20">No family records added</p>
        )}
      </div>
    </div>
  );
};

export const EducationFields = ({ control, register, errors, watch }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "education" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-base-100 pb-2">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5" /> III. Educational Background
        </h4>
        <button type="button" onClick={() => append({ level: 'COLLEGE', school_name: '', degree_course: '' })} className="btn btn-ghost btn-xs text-primary font-black uppercase tracking-widest">
          <Plus className="w-3 h-3 mr-1" /> Add Education
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 bg-base-50 rounded-xl border border-base-100 space-y-4">
            <div className="flex justify-between items-center">
               <span className="text-[9px] font-black uppercase tracking-widest opacity-30">{watch(`education.${index}.level`) || 'Education Record'}</span>
               <button type="button" onClick={() => remove(index)} className="btn btn-ghost btn-xs text-error">
                 <Trash2 className="w-3 h-3" />
               </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Level</label>
                <select {...register(`education.${index}.level`)} className="select select-sm select-bordered w-full text-[10px] font-bold">
                  <option value="ELEMENTARY">Elementary</option>
                  <option value="SECONDARY">Secondary</option>
                  <option value="VOCATIONAL">Vocational</option>
                  <option value="COLLEGE">College</option>
                  <option value="GRADUATE">Graduate</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">School / Course</label>
                <input {...register(`education.${index}.school_name`)} placeholder="School" className="input input-sm input-bordered w-full text-[10px] font-bold mb-1" />
                <input {...register(`education.${index}.degree_course`)} placeholder="Course" className="input input-sm input-bordered w-full text-[10px] font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40">From</label>
                  <input type="date" {...register(`education.${index}.period_from`)} className="input input-sm input-bordered w-full text-[10px] font-bold" />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40">To</label>
                  <input {...register(`education.${index}.period_to`)} placeholder="Date or 'present'" className="input input-sm input-bordered w-full text-[10px] font-bold" />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Year</label>
                  <input {...register(`education.${index}.year_graduated`)} placeholder="YYYY" className="input input-sm input-bordered w-full text-[10px] font-bold" />
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EligibilityFields = ({ control, register, errors }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "eligibilities" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-base-100 pb-2">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
          <Award className="w-3.5 h-3.5" /> IV. Civil Service Eligibility
        </h4>
        <button type="button" onClick={() => append({ service: '', rating: '' })} className="btn btn-ghost btn-xs text-primary font-black uppercase tracking-widest">
          <Plus className="w-3 h-3 mr-1" /> Add Eligibility
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 bg-base-50 rounded-xl border border-base-100 space-y-4">
            <div className="flex justify-between items-center">
               <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Eligibility #{index + 1}</span>
               <button type="button" onClick={() => remove(index)} className="btn btn-ghost btn-xs text-error">
                 <Trash2 className="w-3 h-3" />
               </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Service / Title</label>
                <input {...register(`eligibilities.${index}.service`)} className="input input-sm input-bordered w-full text-[11px] font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Rating / Date</label>
                <input {...register(`eligibilities.${index}.rating`)} placeholder="Rating" className="input input-sm input-bordered w-full text-[10px] font-bold mb-1" />
                <input type="date" {...register(`eligibilities.${index}.date_of_exam`)} className="input input-sm input-bordered w-full text-[10px] font-bold" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WorkHistoryFields = ({ control, register, errors }) => {
  const { fields, append, remove } = useFieldArray({ control, name: "work_experience" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-base-100 pb-2">
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
          <History className="w-3.5 h-3.5" /> V. Work Experience
        </h4>
        <button type="button" onClick={() => append({ position_title: '', agency: '', is_gov_service: true })} className="btn btn-ghost btn-xs text-primary font-black uppercase tracking-widest">
          <Plus className="w-3 h-3 mr-1" /> Add Experience
        </button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 bg-base-50 rounded-xl border border-base-100 space-y-4">
            <div className="flex justify-between items-center">
               <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Job #{index + 1}</span>
               <button type="button" onClick={() => remove(index)} className="btn btn-ghost btn-xs text-error">
                 <Trash2 className="w-3 h-3" />
               </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Position Title</label>
                <input {...register(`work_experience.${index}.position_title`)} className="input input-sm input-bordered w-full text-[11px] font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Agency / Company</label>
                <input {...register(`work_experience.${index}.agency`)} className="input input-sm input-bordered w-full text-[11px] font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40">From</label>
                  <input type="date" {...register(`work_experience.${index}.date_from`)} className="input input-sm input-bordered w-full text-[10px] font-bold" />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40">To</label>
                  <input {...register(`work_experience.${index}.date_to`)} placeholder="Date or 'present'" className="input input-sm input-bordered w-full text-[10px] font-bold" />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Gov't Service</label>
                  <select {...register(`work_experience.${index}.is_gov_service`)} className="select select-sm select-bordered w-full text-[10px] font-bold">
                     <option value={true}>Yes</option>
                     <option value={false}>No</option>
                  </select>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
