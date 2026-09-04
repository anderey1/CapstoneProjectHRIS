import React from 'react';
import { Pencil } from 'lucide-react';

const PersonalInfoTab = ({ me, onEdit, canEdit = true }) => {
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Personal Details</h3>
          <p className="text-xs text-slate-500 mt-0.5">Civil Service Form 212 (Personal Data Sheet) Section I</p>
        </div>
        {canEdit && (
          <button 
            onClick={onEdit}
            className="btn btn-sm h-8 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium"
          >
            <Pencil className="w-3 h-3 mr-1 text-slate-400" /> Edit
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 bg-slate-50/60 rounded-lg border border-slate-200/70">
          <p className="text-xs font-medium text-slate-500">Full Name</p>
          <p className="font-semibold text-slate-900 mt-1 text-sm">
            {me?.first_name} {me?.middle_name || ''} {me?.last_name} {me?.name_extension || ''}
          </p>
        </div>
        <div className="p-3.5 bg-slate-50/60 rounded-lg border border-slate-200/70">
          <p className="text-xs font-medium text-slate-500">Sex / Gender</p>
          <p className="font-semibold text-slate-900 mt-1 text-sm">{me?.sex || 'Not Specified'}</p>
        </div>
        <div className="p-3.5 bg-slate-50/60 rounded-lg border border-slate-200/70">
          <p className="text-xs font-medium text-slate-500">Date of Birth</p>
          <p className="font-semibold text-slate-900 mt-1 text-sm">{me?.date_of_birth ? new Date(me.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not Specified'}</p>
        </div>
        <div className="p-3.5 bg-slate-50/60 rounded-lg border border-slate-200/70">
          <p className="text-xs font-medium text-slate-500">Civil Status</p>
          <p className="font-semibold text-slate-900 mt-1 text-sm">{me?.civil_status || 'Single'}</p>
        </div>
        <div className="p-3.5 bg-slate-50/60 rounded-lg border border-slate-200/70">
          <p className="text-xs font-medium text-slate-500">Place of Birth</p>
          <p className="font-semibold text-slate-900 mt-1 text-sm">{me?.place_of_birth || 'Not Specified'}</p>
        </div>
        <div className="p-3.5 bg-slate-50/60 rounded-lg border border-slate-200/70">
          <p className="text-xs font-medium text-slate-500">Contact Number</p>
          <p className="font-semibold text-slate-900 mt-1 text-sm">{me?.mobile_no || 'Not Specified'}</p>
        </div>
        <div className="p-3.5 bg-slate-50/60 rounded-lg border border-slate-200/70 sm:col-span-2">
          <p className="text-xs font-medium text-slate-500">Residential Address</p>
          <p className="font-semibold text-slate-900 mt-1 text-xs leading-relaxed">{me?.residential_address || 'Not Specified'}</p>
        </div>
        <div className="p-3.5 bg-slate-50/60 rounded-lg border border-slate-200/70 sm:col-span-2">
          <p className="text-xs font-medium text-slate-500">Permanent Address</p>
          <p className="font-semibold text-slate-900 mt-1 text-xs leading-relaxed">{me?.permanent_address || 'Not Specified'}</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoTab;
