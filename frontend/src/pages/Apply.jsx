import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { INITIAL_FILES } from './apply/applyConstants';
import ApplicantInfoFields from './apply/ApplicantInfoFields';
import DocumentSectionsAccordion from './apply/DocumentSectionsAccordion';
import ApplicationSuccess from './apply/ApplicationSuccess';

/**
 * Official DepEd Division Job Application & Checklist Portal
 * Conforms to DepEd Order No. 007, s. 2023 Guidelines.
 */
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

  const isMandatoryComplete = Boolean(
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
      let msg = 'We encountered an issue submitting your application.';
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
    <div className="min-h-screen flex flex-col justify-between bg-slate-100 text-slate-900">
      {/* DepEd Institutional Top Header Bar */}
      <header className="w-full bg-[#0038A8] border-b-2 border-[#FCD116] px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/Deped2.png" alt="Republic of the Philippines Seal" className="w-9 h-9 object-contain" />
            <div className="w-px h-7 bg-blue-300/40"></div>
            <img src="/Deped logo.png" alt="Department of Education" className="h-8 object-contain" />
            <div className="text-white">
              <p className="text-xs font-bold uppercase tracking-wide leading-none">Republic of the Philippines</p>
              <p className="text-[11px] font-semibold text-blue-100 uppercase tracking-tight mt-0.5">Department of Education • Division of Lucena City</p>
            </div>
          </div>
          <Link to="/login" className="text-xs text-blue-100 hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-3xl bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
          {/* Form Header */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-base font-bold uppercase tracking-tight text-slate-900">
                Official Job Application & 201-Checklist Submission
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Pursuant to DepEd Order No. 007, s. 2023 (Comparative Assessment Guidelines)
              </p>
            </div>
            <span className="inline-block px-2.5 py-1 bg-blue-50 border border-blue-200 text-[#0038A8] text-[11px] font-semibold uppercase rounded self-start sm:self-auto">
              Public Portal
            </span>
          </div>

          <div className="p-6 sm:p-8">
            {errorMsg && (
              <div role="alert" className="mb-6 bg-red-50 border border-red-300 p-3.5 rounded flex items-start gap-2.5 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Applicant Personal & Contact Info Fields */}
              <div>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                  <span className="w-5 h-5 rounded-full bg-[#0038A8] text-white text-[10px] font-bold flex items-center justify-center font-mono">1</span>
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                    Applicant Information & Position Applied
                  </h2>
                </div>
                <ApplicantInfoFields register={register} errors={errors} />
              </div>

              {/* 201-Document Upload Accordion */}
              <div>
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                  <span className="w-5 h-5 rounded-full bg-[#0038A8] text-white text-[10px] font-bold flex items-center justify-center font-mono">2</span>
                  <h2 className="text-xs font-bold uppercase tracking-wide text-slate-800">
                    Documentary Requirements & Compliance Checklist
                  </h2>
                </div>
                <DocumentSectionsAccordion
                  collapsedSections={collapsedSections}
                  toggleSection={toggleSection}
                  uploadedFiles={uploadedFiles}
                  fileErrors={fileErrors}
                  handleFileChange={handleFileChange}
                  handleFileRemove={handleFileRemove}
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <Link 
                  to="/login" 
                  className="text-xs font-semibold text-slate-600 hover:text-[#0038A8] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </Link>
                <button
                  type="submit"
                  disabled={!isMandatoryComplete || isLoading}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#0038A8] hover:bg-[#002d86] text-white text-xs font-semibold uppercase tracking-wider rounded border border-[#002d86] shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? 'Submitting Application...' : !isMandatoryComplete ? 'Upload Mandatory Documents (*)' : 'Submit Official Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <p>Department of Education — Schools Division of Lucena City • Human Resource Information System</p>
      </footer>
    </div>
  );
};

export default Apply;
