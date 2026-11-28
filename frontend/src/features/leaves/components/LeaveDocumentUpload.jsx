import { useId, useRef, useState } from 'react';
import { Check, Paperclip, X } from 'lucide-react';

export default function LeaveDocumentUpload({ document, existingUrl }) {
  const id = useId();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  return (
    <div className="min-w-0 space-y-2 rounded-lg border border-slate-200 bg-white p-4">
      <label htmlFor={id} className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-slate-900">
        <span>{document.label}</span>
        <span className={`text-xs ${document.required ? 'font-medium text-primary' : 'text-slate-500'}`}>
          {document.required ? 'Required' : 'Optional'}
        </span>
      </label>
      <p id={`${id}-help`} className="text-xs leading-relaxed text-slate-600">{document.help}</p>
      {existingUrl && (
        <a
          href={existingUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary underline"
        >
          <Paperclip className="size-3.5" aria-hidden="true" />
          <span>Current attachment (kept unless replaced)</span>
        </a>
      )}
      <input
        ref={input}
        id={id}
        name={document.name}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        required={document.required && !existingUrl}
        aria-describedby={`${id}-help`}
        className="file-input file-input-bordered min-h-11 w-full min-w-0 rounded-lg border-slate-300 bg-white text-xs sm:text-sm"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
      />
      {file && (
        <div className="flex min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
          <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-slate-700" title={file.name}>
            {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
          </span>
          <button
            type="button"
            aria-label={`Remove ${document.label}`}
            className="btn btn-ghost btn-square min-h-11 min-w-11 shrink-0 text-slate-600 hover:text-error"
            onClick={() => {
              input.current.value = '';
              setFile(null);
            }}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
