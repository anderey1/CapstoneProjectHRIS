import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { INITIAL_FILES } from './apply/applyConstants';
import ApplicantInfoFields from './apply/ApplicantInfoFields';
import DocumentSectionsAccordion from './apply/DocumentSectionsAccordion';
import ApplicationSuccess from './apply/ApplicationSuccess';

const Apply = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [uploadedFiles, setUploadedFiles] = useState(INITIAL_FILES);
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
      setUploadedFiles(INITIAL_FILES);
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
    return <ApplicationSuccess />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] relative overflow-hidden py-12 px-6">
      <div className="absolute top-0 left-0 w-full h-2 bg-[#0038A8]"></div>

      <div className="w-full max-w-2xl bg-white shadow-lg border border-slate-200 rounded-xl overflow-hidden z-10 my-6">
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
            <ApplicantInfoFields register={register} errors={errors} />

            <DocumentSectionsAccordion
              collapsedSections={collapsedSections}
              toggleSection={toggleSection}
              uploadedFiles={uploadedFiles}
              fileErrors={fileErrors}
              handleFileChange={handleFileChange}
              handleFileRemove={handleFileRemove}
            />

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
      
      <div className="text-center mt-4 opacity-40">
        <p className="text-[9px] font-black uppercase tracking-widest">
          © 2026 DepEd Lucena City Division • Secure Application Submission
        </p>
      </div>
    </div>
  );
};

export default Apply;
