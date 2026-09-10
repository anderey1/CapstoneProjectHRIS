import React from 'react';
import { 
  User, Mail, Briefcase, Camera, Fingerprint, 
  Globe, Shield, CheckCircle2, Pencil, Building2, 
  FileText, Award 
} from 'lucide-react';
import { REQUIRED_DOCS_LIST } from './constants';

const ProfileHeader = ({ 
  me, 
  profilePhoto, 
  onEditProfile, 
  onChangePhoto, 
  simulatedDocs, 
  completion,
  canEditProfile = false,
  canChangePhoto = false
}) => {
  const uploadedDocsCount = Object.keys(simulatedDocs || {}).length;
  const mandatoryDocsCount = REQUIRED_DOCS_LIST.filter(d => d.mandatory).length;
  const uploadedMandatoryCount = REQUIRED_DOCS_LIST
    .filter(d => d.mandatory)
    .filter(d => simulatedDocs?.[d.key]).length;

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-100 flex items-center justify-center">
              {profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-50 text-[#0038A8] flex items-center justify-center font-bold text-2xl uppercase">
                  {me?.first_name?.charAt(0) || <User className="w-10 h-10 text-slate-400" />}
                </div>
              )}
            </div>
            {canChangePhoto && (
              <button 
                onClick={onChangePhoto}
                className="absolute -bottom-2 -right-2 btn btn-circle btn-xs bg-[#0038A8] text-white hover:bg-[#002d86] border-2 border-white shadow transition-all"
                title="Change Profile Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* User Details */}
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {me?.first_name} {me?.middle_name ? `${me.middle_name.charAt(0)}.` : ''} {me?.last_name} {me?.name_extension || ''}
              </h2>
              
              <span className="px-2.5 py-0.5 bg-blue-50 text-[#0038A8] rounded-full text-xs font-medium border border-blue-100">
                {me?.user_details?.role?.replace('_', ' ') || 'Staff'}
              </span>
              
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${
                me?.date_hired 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border-amber-100'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {me?.date_hired ? 'Permanent / Appointed' : 'Comparative Assessment'}
              </span>
            </div>
            
            <p className="text-xs font-semibold text-slate-700 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" /> {me?.position || 'Teacher I'} • {me?.department || 'Operations'}
            </p>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-1.5 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {me?.email || me?.user_details?.email}</span>
              {me?.mobile_no && <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-slate-400" /> {me.mobile_no}</span>}
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400"><Fingerprint className="w-3.5 h-3.5 text-slate-400" /> ID #{me?.id?.toString().padStart(5, '0')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          {(canEditProfile || canChangePhoto) && (
            <div className="flex flex-wrap gap-2 pt-2 md:pt-0 shrink-0">
              {canEditProfile && (
                <button 
                  onClick={onEditProfile}
                  className="btn btn-sm h-9 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1 text-slate-400" /> Edit Profile
                </button>
              )}
              {canChangePhoto && (
                <button 
                  onClick={onChangePhoto}
                  className="btn btn-sm h-9 px-3.5 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded-lg text-xs font-medium transition-colors shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 mr-1" /> Change Photo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Profile Completion Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Profile Completion</span>
            <span className="text-xs font-bold text-[#0038A8]">{completion}%</span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#0038A8] h-2 rounded-full transition-all duration-500" 
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-2 block">PDS core fields verified</span>
          </div>
        </div>

        {/* 2. Submitted Applications Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Personnel Form</span>
            <span className="text-base font-bold text-slate-800 mt-1 block">Active Record</span>
            <span className="text-xs text-slate-500 block mt-0.5 truncate max-w-[170px]">{me?.position || 'Teacher I'}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0038A8] flex items-center justify-center shrink-0 border border-blue-100">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {/* 3. Uploaded Documents Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Required Documents</span>
            <span className="text-base font-bold text-slate-800 mt-1 block">{uploadedDocsCount} of {REQUIRED_DOCS_LIST.length} Uploaded</span>
            <span className="text-xs text-slate-500 block mt-0.5">
              {uploadedMandatoryCount} of {mandatoryDocsCount} mandatory
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0038A8] flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        {/* 4. Eligibility Status Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">Civil Service / PRC</span>
            <span className="text-base font-bold text-slate-800 mt-1 block truncate max-w-[160px]">
              {me?.eligibilities?.length > 0 ? me.eligibilities[0].service : 'Not Registered'}
            </span>
            <span className="text-xs text-emerald-600 block mt-0.5">
              {me?.eligibilities?.length > 0 ? `Rating: ${me.eligibilities[0].rating}%` : 'Eligibility pending'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0038A8] flex items-center justify-center shrink-0 border border-blue-100">
            <Award className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
