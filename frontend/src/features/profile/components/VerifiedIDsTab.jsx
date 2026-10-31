import React from 'react';
import { Fingerprint, FileText, ShieldCheck, Upload, Trash2, Eye, RefreshCw } from 'lucide-react';
import { GOVERNMENT_IDS_LIST } from './constants';

const VerifiedIDsTab = ({ 
  me, 
  simulatedIDs, 
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
        <h3 className="text-sm font-bold text-slate-900">Government Identification</h3>
        <p className="text-xs text-slate-500 mt-0.5">Civil Service Form 212 identification numbers & scanned credentials</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {GOVERNMENT_IDS_LIST.map((doc) => {
          const number = me?.[doc.id];
          const idData = simulatedIDs?.[doc.id];
          const hasFile = !!idData?.fileName;
          const isVerified = !!idData?.verified;
          const uploadDate = idData?.uploadDate;

          return (
            <div key={doc.id} className="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors flex flex-col justify-between space-y-3.5 shadow-sm">
              <div className="flex gap-3 items-start">
                <div className="w-12 h-10 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center shrink-0">
                  {hasFile ? (
                    <FileText className="w-4 h-4 text-[#0038A8]" />
                  ) : (
                    <Fingerprint className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-xs text-slate-900 truncate">{doc.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{doc.desc}</p>
                  
                  {number ? (
                    <p className="text-xs font-mono font-medium text-slate-800 mt-2 bg-slate-100 px-2 py-0.5 rounded inline-block">
                      {number}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-2">Not provided</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs pt-2.5 border-t border-slate-100">
                <div>
                  <span className="text-slate-500 mr-1.5 font-normal">Status:</span>
                  <span className={`inline-flex items-center gap-1 font-medium ${
                    number ? (isVerified ? 'text-emerald-700' : 'text-amber-700') : 'text-slate-400'
                  }`}>
                    {number ? (
                      <>
                        <ShieldCheck className="w-3 h-3" />
                        {isVerified ? 'Verified' : 'Pending Verification'}
                      </>
                    ) : 'Missing'}
                  </span>
                </div>
                
                {uploadDate && (
                  <div className="text-right text-slate-500 font-normal">
                    <span>Uploaded: {uploadDate}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2.5 border-t border-slate-100">
                {number ? (
                  <>
                    <button 
                      onClick={() => onPreview(doc)}
                      className="btn btn-sm h-7 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded shadow-none"
                    >
                      <Eye className="w-3 h-3 mr-1" /> Preview
                    </button>
                    {canEdit && (
                      <>
                        <button 
                          onClick={() => onTriggerUpload(doc.id)}
                          className="btn btn-sm h-7 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded shadow-none"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Replace
                        </button>
                        <button 
                          onClick={() => onDelete(doc.id)}
                          className="btn btn-sm h-7 px-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-medium rounded shadow-none"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    
                    {(canVerify || isAdmin) && !isVerified && (
                      <button 
                        onClick={() => onVerify(doc.id, true)}
                        className="btn btn-sm h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded text-xs font-medium shadow-sm"
                      >
                        Approve ID
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full flex justify-end">
                    {canEdit ? (
                      <button 
                        onClick={() => onTriggerUpload(doc.id)}
                        className="btn btn-sm h-7 px-2.5 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded text-xs font-medium flex items-center gap-1 shadow-sm"
                      >
                        <Upload className="w-3 h-3" /> Upload ID
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No document submitted</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VerifiedIDsTab;
