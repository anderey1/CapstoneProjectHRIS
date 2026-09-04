import React from 'react';
import { User, Award, Briefcase, FolderOpen, CheckSquare, ChevronDown, ChevronUp } from 'lucide-react';
import DocumentUploadCard from './DocumentUploadCard';
import { SECTIONS } from './applyConstants';

const SECTION_ICONS = {
  personal: User,
  professional: Award,
  employment: Briefcase,
  supporting: FolderOpen,
  forms: CheckSquare
};

const DocumentSectionsAccordion = ({
  collapsedSections,
  toggleSection,
  uploadedFiles,
  fileErrors,
  handleFileChange,
  handleFileRemove
}) => {
  return (
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
          const Icon = SECTION_ICONS[sec.id] || FolderOpen;
          
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
                    <Icon className="w-4 h-4" />
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
  );
};

export default DocumentSectionsAccordion;
