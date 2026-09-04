import React from 'react';
import { FileCheck, FileText, Upload, Download, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { REQUIRED_DOCS_LIST } from './constants';

const DocumentChecklistTab = ({ 
  simulatedDocs, 
  isAdmin,
  canEdit = true,
  canVerify = false,
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

      <div className="space-y-2.5">
        {REQUIRED_DOCS_LIST.map((doc) => {
          const docData = simulatedDocs?.[doc.key];
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
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                      <span>File: <span className="font-mono text-slate-700 font-medium break-all">{fileName}</span></span>
                      {uploadDate && <span>Uploaded: <span className="text-slate-700 font-medium">{uploadDate}</span></span>}
                      <span>Status: <span className={isDocVerified ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
                        {isDocVerified ? 'Verified by Admin' : 'Pending Verification'}
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
                      className="btn btn-sm h-7 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded shadow-none"
                    >
                      <Eye className="w-3 h-3 mr-1" /> Preview
                    </button>
                    
                    <a 
                      href={docData.fileData || '#'} 
                      download={fileName}
                      onClick={(e) => {
                        if (!docData.fileData) {
                          e.preventDefault();
                          alert("Simulating standard file download package.");
                        }
                      }}
                      className="btn btn-sm h-7 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded shadow-none flex items-center"
                    >
                      <Download className="w-3 h-3 mr-1" /> Download
                    </a>
                    
                    {canEdit && (
                      <>
                        <button 
                          onClick={() => onTriggerUpload(doc.key)}
                          className="btn btn-sm h-7 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded shadow-none"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Replace
                        </button>
                        
                        <button 
                          onClick={() => onDelete(doc.key)}
                          className="btn btn-sm h-7 px-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-medium rounded shadow-none"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}

                    {(canVerify || isAdmin) && (
                      <button 
                        onClick={() => onVerify(doc.key, !isDocVerified)}
                        className={`btn btn-sm h-7 px-2.5 rounded text-xs font-medium shadow-sm border-none text-white ${
                          isDocVerified ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isDocVerified ? 'Revoke Review' : 'Approve Doc'}
                      </button>
                    )}
                  </>
                ) : (
                  canEdit ? (
                    <button 
                      onClick={() => onTriggerUpload(doc.key)}
                      className="btn btn-sm h-7 px-2.5 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded text-xs font-medium flex items-center gap-1 shadow-sm"
                    >
                      <Upload className="w-3 h-3" /> Upload File
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No document uploaded</span>
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
