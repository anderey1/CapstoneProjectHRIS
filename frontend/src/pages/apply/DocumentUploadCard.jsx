import React from 'react';
import { Upload, FileText, Trash2, Plus, AlertCircle } from 'lucide-react';

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

export default DocumentUploadCard;
