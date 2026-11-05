import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import DocumentUploadCard from './DocumentUploadCard';
import { SECTIONS } from './applyConstants';

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
          <h3 className="text-sm font-semibold text-slate-900">
            Document checklist
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Select every required document to enable submission. Optional documents can be added when applicable.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-600">
            Maximum 10 MB per file
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {SECTIONS.map((sec) => {
          const isCollapsed = collapsedSections[sec.id];
          
          // Calculate completions
          const requiredFields = sec.fields.filter(field => field.mandatory);
          const totalFields = requiredFields.length;
          const completedFields = requiredFields.filter(field => {
            const val = uploadedFiles[field.key];
            if (field.multiple) {
              return val && val.length > 0;
            }
            return !!val;
          }).length;
          
          return (
            <div 
              key={sec.id} 
              className="border-b border-slate-200 bg-white"
            >
              {/* Section Header */}
              <button
                type="button"
                aria-expanded={!isCollapsed}
                aria-controls={`documents-${sec.id}`}
                onClick={() => toggleSection(sec.id)}
                className="w-full flex items-center justify-between gap-3 py-4 hover:bg-slate-50 transition-colors text-left focus-visible:outline-2 focus-visible:outline-primary"
              >
                <div className="flex items-center gap-2.5">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {sec.title}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {totalFields > 0 ? `${completedFields} of ${totalFields} required documents uploaded` : 'Optional documents'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 opacity-40" />
                  ) : (
                    <ChevronUp className="w-4 h-4 opacity-40" />
                  )}
                </div>
              </button>

              {/* Section Body */}
              {!isCollapsed && (
                <div id={`documents-${sec.id}`} className="divide-y divide-slate-200">
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
