import React from 'react';
import { FileText, Trash2, AlertCircle } from 'lucide-react';

const DocumentUploadCard = ({ field, value, error, onFileChange, onFileRemove }) => {
  const fileInputId = `file-input-${field.key}`;
  const files = field.multiple ? value || [] : value ? [value] : [];

  return (
    <div className="bg-white py-5 space-y-3">
      <div>
        <h5 id={`${fileInputId}-title`} className="text-sm font-semibold text-slate-900">
          {field.name} <span className="font-normal text-slate-600">({field.mandatory ? 'Required' : 'Optional'})</span>
        </h5>
        <p id={`${fileInputId}-description`} className="mt-1 text-sm leading-relaxed text-slate-600">{field.description}</p>
        {field.extraInfo && <p className="mt-1 text-xs text-slate-600">{field.extraInfo}</p>}
      </div>
      {error && (
        <div id={`${fileInputId}-error`} role="alert" className="flex items-start gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 break-words">{error}</span>
        </div>
      )}
      {files.length > 0 && (
        <ul className="space-y-2" aria-label={`${field.name} selected files`}>
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-600">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button type="button" aria-label={`Remove ${file.name}`} onClick={() => onFileRemove(field.key, !!field.multiple, field.multiple ? index : null)} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded text-error hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-primary">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div>
        <label htmlFor={fileInputId} className="mb-1.5 block text-sm font-medium text-primary">
          {files.length ? field.multiple ? 'Add files' : 'Replace file' : field.multiple ? 'Choose files' : 'Choose file'}
        </label>
        <input id={fileInputId} type="file" multiple={field.multiple} accept=".pdf,.jpg,.jpeg,.png"
          aria-labelledby={`${fileInputId}-title`}
          aria-invalid={!!error}
          aria-describedby={`${fileInputId}-description ${fileInputId}-formats${error ? ` ${fileInputId}-error` : ''}`}
          onChange={(event) => onFileChange(field.key, event, !!field.multiple)}
          className="block min-h-11 w-full min-w-0 rounded border border-slate-300 bg-white text-sm text-slate-700 file:mr-3 file:min-h-11 file:cursor-pointer file:border-0 file:bg-slate-100 file:px-3 file:text-sm file:font-medium file:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
        <p id={`${fileInputId}-formats`} className="mt-1.5 text-xs text-slate-600">PDF, JPG or PNG. Maximum 10 MB per file.</p>
      </div>
    </div>
  );
};

export default DocumentUploadCard;
