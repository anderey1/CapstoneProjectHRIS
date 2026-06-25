import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { 
  Mail, Phone, User, FileText, Upload, CheckCircle2, ChevronRight, AlertCircle, 
  ArrowLeft, ChevronDown, ChevronUp, Trash2, Plus, Award, Briefcase, FolderOpen, CheckSquare 
} from 'lucide-react';

const POSITIONS = [
  'Teacher I', 'Teacher II', 'Teacher III', 'Master Teacher I', 'Master Teacher II', 'SPED Teacher I',
  'Administrative Officer I', 'Administrative Officer II', 'Administrative Assistant I', 'Administrative Assistant II',
  'Registrar I', 'Accountant I', 'School Principal I'
];

const SECTIONS = [
  {
    id: 'personal',
    title: 'Personal Documents',
    fields: [
      {
        key: 'letter_of_intent',
        name: 'Letter of Intent',
        description: 'Addressed to SUSAN D. ORBIANA, Schools Division Superintendent, Division of Lucena City.',
        mandatory: true,
        multiple: false
      },
      {
        key: 'pds_file',
        name: 'Personal Data Sheet (PDS)',
        description: 'Duly accomplished and notarized. Include Current and Revised 2025 PDS.',
        mandatory: true,
        multiple: false
      },
      {
        key: 'resume',
        name: 'Resume / CV',
        description: 'Your updated Curriculum Vitae or Resume.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional.'
      }
    ]
  },
  {
    id: 'professional',
    title: 'Professional Credentials',
    fields: [
      {
        key: 'prc_documents',
        name: 'PRC Documents',
        description: 'Photocopy of Professional Regulation Commission (PRC) ID and/or License.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional if not applicable.'
      },
      {
        key: 'eligibility_certificate',
        name: 'Eligibility Certificate',
        description: 'Photocopy of Certificate of Eligibility or Report of Rating.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional if applicable.'
      },
      {
        key: 'tor',
        name: 'Transcript of Records (TOR)',
        description: 'Include completion of graduate and post-graduate units/degrees if applicable.',
        mandatory: true,
        multiple: false
      }
    ]
  },
  {
    id: 'employment',
    title: 'Employment Records',
    fields: [
      {
        key: 'employment_documents',
        name: 'Employment Documents',
        description: 'Upload any of the following: Certificate of Employment, Contract of Service, or Service Record.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional if applicable.'
      },
      {
        key: 'latest_appointment',
        name: 'Latest Appointment',
        description: 'Copy of your latest appointment.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional if applicable.'
      },
      {
        key: 'performance_rating',
        name: 'Performance Rating',
        description: 'Latest available period. Must cover one year of performance in the current/latest position.',
        mandatory: false,
        multiple: false,
        extraInfo: 'Optional if applicable.'
      }
    ]
  },
  {
    id: 'supporting',
    title: 'Supporting Documents',
    fields: [
      {
        key: 'certificates_of_training',
        name: 'Certificates of Training',
        description: 'Upload one or more training certificates.',
        mandatory: false,
        multiple: true
      },
      {
        key: 'specialized_training',
        name: 'Specialized Training Certificates',
        description: 'Upload specialized training certificates. Multiple uploads allowed.',
        mandatory: false,
        multiple: true
      }
    ]
  },
  {
    id: 'forms',
    title: 'Required Forms',
    fields: [
      {
        key: 'checklist',
        name: 'Checklist of Requirements',
        description: 'Duly signed Checklist of Requirements.',
        mandatory: true,
        multiple: false
      },
      {
        key: 'omnibus',
        name: 'Omnibus Sworn Statement',
        description: 'Omnibus Sworn Statement.',
        mandatory: true,
        multiple: false
      },
      {
        key: 'cav',
        name: 'Certification on the Authenticity and Veracity (CAV)',
        description: 'Certification on the Authenticity and Veracity (CAV) of submitted documents.',
        mandatory: true,
        multiple: false
      },
      {
        key: 'privacy_consent',
        name: 'Data Privacy Consent Form',
        description: 'Signed Data Privacy Consent Form.',
        mandatory: true,
        multiple: false
      }
    ]
  }
];

const DocumentUploadCard = ({ field, value, error, onFileChange, onFileRemove }) => {
  const fileInputId = `file-input-${field.key}`;

  return (
    <div className="p-4 bg-base-50/30 border border-base-200 rounded-xl space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h5 className="text-[11px] font-black text-base-content/85 flex items-center gap-1">
            {field.name}
            {field.mandatory && <span className="text-error font-extrabold">*</span>}
          </h5>
          <p className="text-[10px] font-bold text-base-content/50 leading-relaxed mt-0.5">
            {field.description}
          </p>
          {field.extraInfo && (
            <p className="text-[9px] font-medium text-primary/75 italic mt-0.5">
              {field.extraInfo}
            </p>
          )}
          {field.key === 'letter_of_intent' && (
            <div className="mt-1.5 p-2.5 bg-primary/5 rounded-lg border border-primary/10 text-[9px] text-[#0038A8] font-bold leading-normal">
              <span className="font-extrabold block text-[8px] uppercase tracking-wider mb-0.5 opacity-70">Addressed To:</span>
              SUSAN D. ORBIANA<br />
              Schools Division Superintendent<br />
              Division of Lucena City
            </div>
          )}
        </div>
        
        <div className="text-right shrink-0">
          <span className="inline-block px-2 py-0.5 bg-base-200 text-base-content/60 rounded-md text-[8px] font-black uppercase tracking-wider">
            PDF, JPG, PNG (Max 10MB)
          </span>
        </div>
      </div>

      <div>
        {error && (
          <div className="flex items-center gap-1.5 p-2 mb-2 bg-error/5 border border-error/15 rounded-lg text-[9px] font-bold text-error">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {(!value || (field.multiple && value.length === 0)) ? (
          <div>
            <label 
              htmlFor={fileInputId}
              className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-base-300 hover:border-primary/50 bg-white hover:bg-primary/5 cursor-pointer rounded-xl transition-all group"
            >
              <Upload className="w-5 h-5 text-base-content/30 group-hover:text-primary group-hover:scale-105 transition-all mb-1" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#0038A8]">
                {field.multiple ? "Upload Files" : "Upload Document"}
              </span>
              <input 
                id={fileInputId}
                type="file"
                multiple={field.multiple}
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => onFileChange(field.key, e, field.multiple)}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-1.5">
            {field.multiple ? (
              value.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-base-200 rounded-lg shadow-inner">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate pr-3 text-base-content/85">{file.name}</p>
                      <p className="text-[8px] font-black text-base-content/30 uppercase">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onFileRemove(field.key, true, idx)}
                    className="btn btn-ghost btn-xs text-error font-extrabold uppercase hover:bg-error/10 min-h-0 h-6 px-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-between p-2.5 bg-white border border-base-200 rounded-lg shadow-inner">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold truncate pr-3 text-base-content/85">{value.name}</p>
                    <p className="text-[8px] font-black text-base-content/30 uppercase">
                      {(value.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <label 
                    htmlFor={fileInputId}
                    className="btn bg-[#0038A8] hover:bg-[#002d86] text-white border-none btn-xs text-[8px] font-black uppercase tracking-wider rounded-md h-6 px-2.5 flex items-center justify-center cursor-pointer"
                  >
                    Replace
                  </label>
                  <input 
                    id={fileInputId}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => onFileChange(field.key, e, false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => onFileRemove(field.key, false)}
                    className="btn btn-ghost btn-xs text-error font-extrabold uppercase hover:bg-error/10 min-h-0 h-6 px-1.5"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {field.multiple && (
              <div className="flex justify-end pt-0.5">
                <label 
                  htmlFor={`${fileInputId}-more`}
                  className="btn btn-outline btn-primary btn-xs text-[8px] font-black uppercase tracking-wider rounded-md h-6 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add More
                </label>
                <input 
                  id={`${fileInputId}-more`}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => onFileChange(field.key, e, true)}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Apply = () => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [uploadedFiles, setUploadedFiles] = useState({
    letter_of_intent: null,
    pds_file: null,
    resume: null,
    prc_documents: null,
    eligibility_certificate: null,
    tor: null,
    certificates_of_training: [],
    employment_documents: null,
    latest_appointment: null,
    performance_rating: null,
    specialized_training: [],
    checklist: null,
    omnibus: null,
    cav: null,
    privacy_consent: null
  });

  const [fileErrors, setFileErrors] = useState({});

  const [collapsedSections, setCollapsedSections] = useState({
    personal: false,
    professional: true,
    employment: true,
    supporting: true,
    forms: true,
  });

  const toggleSection = (id) => {
    setCollapsedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleFileChange = (key, event, isMultiple = false, index = null) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const validFiles = [];
    const errorsCopy = { ...fileErrors };

    for (let file of files) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        errorsCopy[key] = `Invalid type: ${file.name}. Only PDF, JPG, JPEG, and PNG are allowed.`;
        setFileErrors(errorsCopy);
        return;
      }

      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        errorsCopy[key] = `Exceeds 10MB limit: ${file.name}`;
        setFileErrors(errorsCopy);
        return;
      }

      validFiles.push(file);
    }

    delete errorsCopy[key];
    setFileErrors(errorsCopy);

    setUploadedFiles(prev => {
      if (isMultiple) {
        if (index !== null) {
          const newArr = [...prev[key]];
          newArr[index] = validFiles[0];
          return { ...prev, [key]: newArr };
        } else {
          return { ...prev, [key]: [...prev[key], ...validFiles] };
        }
      } else {
        return { ...prev, [key]: validFiles[0] };
      }
    });

    event.target.value = null;
  };

  const handleFileRemove = (key, isMultiple = false, index = null) => {
    setUploadedFiles(prev => {
      if (isMultiple) {
        const newArr = prev[key].filter((_, i) => i !== index);
        return { ...prev, [key]: newArr };
      } else {
        return { ...prev, [key]: null };
      }
    });
  };

  const isMandatoryComplete = !!(
    uploadedFiles.letter_of_intent &&
    uploadedFiles.pds_file &&
    uploadedFiles.tor &&
    uploadedFiles.checklist &&
    uploadedFiles.omnibus &&
    uploadedFiles.cav &&
    uploadedFiles.privacy_consent
  );

  const onSubmit = async (data) => {
    setIsLoading(true);
    setErrorMsg('');
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });

    Object.keys(uploadedFiles).forEach(key => {
      const val = uploadedFiles[key];
      if (Array.isArray(val)) {
        val.forEach(file => {
          formData.append(key, file);
        });
      } else if (val) {
        formData.append(key, val);
      }
    });

    try {
      await api.post('applicants/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsSubmitted(true);
      reset();
      setUploadedFiles({
        letter_of_intent: null,
        pds_file: null,
        resume: null,
        prc_documents: null,
        eligibility_certificate: null,
        tor: null,
        certificates_of_training: [],
        employment_documents: null,
        latest_appointment: null,
        performance_rating: null,
        specialized_training: [],
        checklist: null,
        omnibus: null,
        cav: null,
        privacy_consent: null
      });
      setFileErrors({});
    } catch (err) {
      console.error(err);
      const errData = err.response?.data;
      let msg = "We encountered an issue submitting your application.";
      if (typeof errData === 'object' && errData !== null) {
         msg = Object.entries(errData).map(([k, v]) => `${k}: ${v}`).join('\n');
      }
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };


  if (isSubmitted) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] relative overflow-hidden p-6">
           <div className="absolute top-0 left-0 w-full h-2 bg-[#0038A8]"></div>
           <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#0038A8]/5 rounded-full blur-3xl"></div>
           <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#FCD116]/5 rounded-full blur-3xl"></div>
           
           <div className="card w-full max-w-lg bg-white shadow-2xl border border-base-300 rounded-2xl overflow-hidden z-10 text-center p-8 sm:p-12 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-success/10">
                 <CheckCircle2 className="w-10 h-10" />
              </div>
              <h1 className="text-2xl font-black text-[#0038A8] uppercase tracking-tight mb-2">Application Submitted!</h1>
              <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-6">DepEd Lucena City Division</p>
              
              <div className="bg-success/5 border border-success/15 rounded-xl p-4 text-xs font-medium text-success/80 mb-8 leading-relaxed max-w-sm mx-auto">
                 Thank you for submitting your application. We have dispatched a confirmation receipt containing your evaluation summary to your registered email address.
              </div>

              <a 
                 href="/login" 
                 className="btn bg-[#0038A8] hover:bg-[#002d86] text-white border-none shadow-lg shadow-blue-900/20 rounded-xl text-xs font-black uppercase tracking-widest px-8 h-12"
              >
                 Return to Login
              </a>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] relative overflow-hidden py-12 px-6">
      
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 w-full h-2 bg-[#0038A8]"></div>
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#0038A8]/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#FCD116]/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-2xl bg-white shadow-2xl border border-base-300 rounded-2xl overflow-hidden z-10 my-6 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* Header Block */}
        <div className="p-8 sm:p-10 border-b border-base-100 bg-base-50/30 flex flex-col items-center text-center">
          <div className="flex items-center gap-4 mb-6">
            <img src="/Deped2.png" alt="DepEd Seal" className="w-14 h-14 drop-shadow-sm" />
            <div className="w-px h-10 bg-base-300"></div>
            <img src="/Deped logo.png" alt="DepEd Logo" className="h-10" />
          </div>
          
          <h1 className="text-xl font-black text-[#0038A8] uppercase tracking-tight">Job Application Portal</h1>
          <p className="text-[10px] font-black text-base-content/40 uppercase tracking-[0.2em] mt-1.5">
             Division of Lucena City
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 sm:p-10">
          
          {errorMsg && (
            <div className="alert alert-error bg-error/10 border-error/20 text-error rounded-xl p-4 flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div className="flex-1">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1">Submission Error</p>
                 <p className="text-xs font-bold opacity-80 whitespace-pre-wrap">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">First Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    {...register('first_name', { required: "First name is required" })}
                    type="text"
                    placeholder="John"
                    className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                  />
                </div>
                {errors.first_name && <p className="text-[9px] text-error font-bold ml-1">{errors.first_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Middle Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    {...register('middle_name')}
                    type="text"
                    placeholder="M.I."
                    className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Last Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    {...register('last_name', { required: "Last name is required" })}
                    type="text"
                    placeholder="Doe"
                    className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                  />
                </div>
                {errors.last_name && <p className="text-[9px] text-error font-bold ml-1">{errors.last_name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    {...register('email', { 
                       required: "Email is required",
                       pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                    })}
                    type="email"
                    placeholder="john.doe@example.com"
                    className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                  />
                </div>
                {errors.email && <p className="text-[9px] text-error font-bold ml-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Mobile Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none opacity-30 group-focus-within:opacity-100 group-focus-within:text-[#0038A8] transition-all">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    {...register('phone', { required: "Contact number is required" })}
                    type="text"
                    placeholder="09123456789"
                    className="input input-bordered w-full pl-11 bg-base-50 focus:border-[#0038A8] rounded-xl text-xs font-bold"
                  />
                </div>
                {errors.phone && <p className="text-[9px] text-error font-bold ml-1">{errors.phone.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Target Position</label>
              <select
                {...register('position_applied', { required: "Please select a target position" })}
                className="select select-bordered w-full bg-base-50 border-base-200 focus:border-[#0038A8] rounded-xl text-xs font-bold"
              >
                <option value="">Select a Position</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.position_applied && <p className="text-[9px] text-error font-bold ml-1">{errors.position_applied.message}</p>}
            </div>

            {/* Collapsible Required Documents Section */}
            <div className="space-y-4 pt-4 border-t border-base-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-black text-[#0038A8] uppercase tracking-wider">
                    Required Documents
                  </h3>
                  <p className="text-[10px] font-bold text-base-content/40 mt-0.5">
                    Please upload all mandatory documents (marked with <span className="text-error font-extrabold">*</span>) to enable submission.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-[#0038A8]/10 text-[#0038A8] rounded-md text-[8px] font-black uppercase tracking-wider">
                    Maximum 10 MB per file
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                {SECTIONS.map((sec) => {
                  const isCollapsed = collapsedSections[sec.id];
                  
                  // Calculate completions
                  const totalFields = sec.fields.length;
                  const completedFields = sec.fields.filter(field => {
                    const val = uploadedFiles[field.key];
                    if (field.multiple) {
                      return val && val.length > 0;
                    }
                    return !!val;
                  }).length;
                  
                  return (
                    <div 
                      key={sec.id} 
                      className="border border-base-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all"
                    >
                      {/* Section Header */}
                      <button
                        type="button"
                        onClick={() => toggleSection(sec.id)}
                        className="w-full flex items-center justify-between p-3.5 bg-base-50/50 hover:bg-base-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#0038A8]/10 text-[#0038A8] flex items-center justify-center">
                            {sec.id === 'personal' && <User className="w-4 h-4" />}
                            {sec.id === 'professional' && <Award className="w-4 h-4" />}
                            {sec.id === 'employment' && <Briefcase className="w-4 h-4" />}
                            {sec.id === 'supporting' && <FolderOpen className="w-4 h-4" />}
                            {sec.id === 'forms' && <CheckSquare className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-base-content/80">
                              {sec.title}
                            </h4>
                            <p className="text-[9px] font-bold text-base-content/40">
                              {completedFields} of {totalFields} uploaded
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {completedFields === totalFields ? (
                            <span className="px-2 py-0.5 bg-success/15 text-success rounded-md text-[8px] font-black uppercase tracking-wider">
                              Complete
                            </span>
                          ) : completedFields > 0 ? (
                            <span className="px-2 py-0.5 bg-warning/15 text-warning rounded-md text-[8px] font-black uppercase tracking-wider">
                              Incomplete
                            </span>
                          ) : null}
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4 opacity-40" />
                          ) : (
                            <ChevronUp className="w-4 h-4 opacity-40" />
                          )}
                        </div>
                      </button>

                      {/* Section Body */}
                      {!isCollapsed && (
                        <div className="p-4 border-t border-base-200 bg-white/50 space-y-3">
                          {sec.fields.map((field) => (
                            <DocumentUploadCard
                              key={field.key}
                              field={field}
                              value={uploadedFiles[field.key]}
                              error={fileErrors[field.key]}
                              onFileChange={handleFileChange}
                              onFileRemove={handleFileRemove}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-5 border-t border-base-100 flex flex-col sm:flex-row items-center justify-between gap-4">
               <a 
                  href="/login" 
                  className="text-xs font-bold text-base-content/40 hover:text-[#0038A8] transition-colors flex items-center gap-1.5 order-2 sm:order-1"
               >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
               </a>
               <button
                  type="submit"
                  disabled={!isMandatoryComplete || isLoading}
                  className={`btn bg-[#0038A8] hover:bg-[#002d86] text-white border-none shadow-lg shadow-blue-900/20 rounded-xl text-xs font-black uppercase tracking-widest px-8 h-12 w-full sm:w-auto order-1 sm:order-2 ${(!isMandatoryComplete || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                  {isLoading ? "Submitting Application..." : !isMandatoryComplete ? "Incomplete Documents" : (
                     <>
                        Submit Application
                        <ChevronRight className="w-4 h-4 ml-1" />
                     </>
                  )}
               </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Bottom Legal Notice */}
      <div className="text-center mt-4 opacity-40">
        <p className="text-[9px] font-black uppercase tracking-widest">
           © 2026 DepEd Lucena City Division • Secure Application Submission
        </p>
      </div>
    </div>
  );
};

export default Apply;
