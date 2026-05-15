import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Briefcase, ChevronRight } from 'lucide-react';
import PersonalFields from './PersonalFields';
import EmploymentFields from './EmploymentFields';

/**
 * Personnel Form Modal (Add/Edit Employee)
 * 
 * Simple, professional redesign with clean tabs and direct language.
 */
const PersonnelFormModal = ({ isOpen, onClose, onSubmit, isPending, schools, initialData }) => {
  const [activeTab, setActiveTab] = useState('personal'); 
  const isEdit = !!initialData;

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    watch,
    formState: { errors } 
  } = useForm({
    defaultValues: initialData || {
      role: 'EMPLOYEE',
      department: '',
      school: '',
      salary: '',
      date_hired: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset(initialData);
        if (initialData.user_details?.role) {
          setValue('role', initialData.user_details.role);
        }
      } else {
        reset({
          role: 'EMPLOYEE',
          department: '',
          school: '',
          salary: '',
          date_hired: ''
        });
      }
      setActiveTab('personal');
    }
  }, [isOpen, initialData, reset, setValue]);

  if (!isOpen) return null;

  const employeeRole = watch('role');
  const setEmployeeRole = (val) => setValue('role', val);

  const handleProcessSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box rounded-xl p-0 overflow-hidden border border-base-200 max-w-2xl shadow-2xl bg-white flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Page Header */}
        <div className="bg-base-50/50 border-b border-base-100 p-8 flex items-center justify-between">
          <div>
            <h3 className="font-black text-xl text-base-content uppercase tracking-tight">
              {isEdit ? 'Update Staff' : 'Add Staff'}
            </h3>
            <p className="text-[10px] font-black opacity-30 uppercase tracking-widest mt-1">
              {isEdit 
                ? `Editing record for ${initialData.first_name}` 
                : 'Register a new employee record'}
            </p>
          </div>
          <button 
            type="button"
            className="btn btn-ghost btn-sm btn-circle opacity-30 hover:opacity-100" 
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Professional Tabs */}
        <div className="flex border-b border-base-100 px-8 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'personal' 
                ? 'border-primary text-primary' 
                : 'border-transparent opacity-40 hover:opacity-100'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            1. Personal Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('employment')}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === 'employment' 
                ? 'border-primary text-primary' 
                : 'border-transparent opacity-40 hover:opacity-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            2. Work Info
          </button>
        </div>
        
        <form onSubmit={handleSubmit(handleProcessSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-8 overflow-y-auto flex-1 bg-white">
            <div className={activeTab !== 'personal' ? 'hidden' : ''}>
              <PersonalFields 
                isEdit={isEdit} 
                register={register} 
                errors={errors} 
              />
            </div>
            <div className={activeTab !== 'employment' ? 'hidden' : ''}>
              <EmploymentFields 
                schools={schools} 
                register={register} 
                errors={errors}
                employeeRole={employeeRole} 
                setEmployeeRole={setEmployeeRole} 
              />
            </div>
          </div>

          {/* Clean Footer */}
          <div className="p-6 bg-base-50/50 border-t border-base-100 flex items-center justify-end gap-3">
            <button 
              type="button" 
              className="btn btn-ghost text-xs font-black uppercase tracking-widest opacity-40" 
              onClick={onClose}
            >
              Cancel
            </button>
            
            {activeTab === 'personal' ? (
              <button 
                type="button" 
                className="btn btn-primary rounded-lg text-xs font-black uppercase tracking-widest px-8 shadow-md shadow-primary/20"
                onClick={() => setActiveTab('employment')}
              >
                Next Step
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button 
                type="submit" 
                className={`btn btn-primary rounded-lg text-xs font-black uppercase tracking-widest px-10 shadow-md shadow-primary/20 ${isPending ? 'loading' : ''}`}
                disabled={isPending}
              >
                {isPending ? 'Saving...' : (isEdit ? 'Update' : 'Save Staff')}
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose}></div>
    </div>
  );
};

export default PersonnelFormModal;
