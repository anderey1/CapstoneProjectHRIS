import React from 'react';
import { FileCheck, FileText, Upload, Download, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { REQUIRED_DOCS_LIST } from './constants';

const DocumentChecklistTab = ({ 
  documents, 
  canEdit = false,
  canVerify = false,
  busy = false,
  unavailable = false,
  onPreview, 
  onTriggerUpload, 
  onDelete, 
  onVerify 
}) => {
  return (
    <div className="space-y-5">
      <div className="border-b border-slate-100 pb-3.5">
        <h3 className="text-sm font-bold text-slate-900">Required Documents Checklist</h3>
        <p className="text-xs text-slate-500 mt-0.5">Civil Service & DepEd 201-file compliance documents</p>
      </div>

      <div className="space-y-2.5 [&_button]:min-h-11 [&_a]:min-h-11 [&_button]:min-w-11">
        {REQUIRED_DOCS_LIST.map((doc) => {
          const docData = documents?.[doc.key];
          const hasFile = !!docData;
          const uploadDate = docData?.uploadDate;
          const isDocVerified = !!docData?.verified;
          const fileName = docData?.fileName;

          return (
            <div key={doc.key} className="p-3.5 bg-white border border-slate-200 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 hover:border-slate-300 transition-colors shadow-sm">
              <div className="flex gap-3 items-start min-w-0 flex-1">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
                  hasFile ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {hasFile ? <FileCheck className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                </div>
                
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                    {doc.name}
                    {doc.mandatory && <span className="text-rose-600 font-bold">*</span>}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-xl">
                    {doc.description}
                  </p>
                  
                  {hasFile && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-700">
                      <span>File: <span className="font-mono text-slate-700 font-medium break-all">{fileName}</span></span>
                      {uploadDate && <span>Uploaded: <span className="text-slate-700 font-medium">{uploadDate}</span></span>}
                      <span>Status: <span className={isDocVerified ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                        {isDocVerified ? 'Document verified' : 'Document not verified'}
                      </span></span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-2.5 md:pt-0">
                {hasFile ? (
                  <>
                    <button 
                      onClick={() => onPreview(doc)}
                      className="btn min-h-11 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded shadow-none"
                    >
                      <Eye className="w-3 h-3 mr-1" /> Preview
                    </button>
                    
                    {docData.fileData && <a
                      href={docData.fileData}
                      download={fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn min-h-11 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded shadow-none flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" /> Open / download
                    </a>}
                    
                    {canEdit && (
                      <>
                        <button 
                          disabled={busy}
                          onClick={() => onTriggerUpload(doc.key)}
                          className="btn min-h-11 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded shadow-none"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Replace
                        </button>
                        
                        <button 
                          disabled={busy}
                          aria-label={`Remove ${doc.name}`}
                          onClick={() => onDelete(doc.key)}
                          className="btn min-h-11 min-w-11 px-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-sm font-medium rounded shadow-none"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    {canVerify && (
                      <button 
                        disabled={busy}
                        onClick={() => onVerify(doc.key, !isDocVerified)}
                        className={`btn min-h-11 px-2.5 rounded text-sm font-medium shadow-sm border-none text-white ${
                          isDocVerified ? 'bg-amber-800 hover:bg-amber-900' : 'bg-emerald-800 hover:bg-emerald-900'
                        }`}
                      >
                        {isDocVerified ? 'Revoke verification' : 'Verify document'}
                      </button>
                    )}
                  </>
                ) : (
                  canEdit ? (
                    <button 
                      disabled={busy}
                      onClick={() => onTriggerUpload(doc.key)}
                      className="btn min-h-11 px-2.5 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded text-sm font-medium flex items-center gap-1 shadow-sm"
                    >
                      <Upload className="w-3 h-3" /> Upload File
                    </button>
                  ) : (
                    <span className="text-sm text-slate-700">{unavailable ? 'Attachment status unavailable' : 'No document uploaded'}</span>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentChecklistTab;
