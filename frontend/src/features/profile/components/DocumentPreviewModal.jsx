import React from 'react';
import { X, FileText, Download } from 'lucide-react';

const DocumentPreviewModal = ({ previewFile, onClose, me }) => {
  if (!previewFile) return null;

  return (
    <div className="modal modal-open flex items-center justify-center bg-slate-900/60 z-[9999] p-3 sm:p-4 transition-all duration-200">
      <div className="bg-white rounded-lg border border-slate-200 max-w-3xl w-full p-4 sm:p-5 space-y-3.5 sm:space-y-4 shadow-xl relative">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Document Preview</h3>
            <p className="text-xs text-slate-500 mt-0.5">{previewFile.title} ({previewFile.fileName})</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Frame */}
        <div className="h-[48vh] sm:h-[55vh] bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center relative p-3 sm:p-4">
          {previewFile.data === "MOCK_PDF" ? (
            <div className="text-center space-y-3 max-w-md">
              <div className="w-12 h-12 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-center text-rose-600 mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-800">Simulated Document</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Placeholder preview representing the uploaded {previewFile.title} file package in the division archive.
                </p>
              </div>
              <div className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-600 inline-block">
                {previewFile.fileName}
              </div>
            </div>
          ) : previewFile.data === "MOCK_CARD" ? (
            <div className="w-full max-w-md bg-[#0A225C] p-5 rounded-lg border border-blue-900 text-white shadow-md space-y-4 flex flex-col justify-between">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-2.5">
                  <img src="/Deped2.png" className="w-8 h-8 object-contain" alt="DepEd Logo" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wide">Republic of the Philippines</h4>
                    <h5 className="font-semibold text-xs text-[#FCD116]">Department of Education</h5>
                    <p className="text-[10px] text-blue-200">SDO Lucena City</p>
                  </div>
                </div>
                <div className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-medium">
                  Verified
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-[10px] text-blue-200 uppercase tracking-wide">Card Type</p>
                <p className="font-semibold text-xs text-[#FCD116]">{previewFile.title}</p>
              </div>

              <div className="flex justify-between items-end border-t border-blue-800/80 pt-3">
                <div>
                  <p className="text-[10px] text-blue-200 uppercase tracking-wide">Cardholder Name</p>
                  <p className="font-semibold text-xs mt-0.5">{me?.first_name} {me?.last_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-blue-200 uppercase tracking-wide">ID Number</p>
                  <p className="font-mono font-semibold text-xs mt-0.5 text-[#FCD116]">{previewFile.number || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <img 
              src={previewFile.data} 
              alt={previewFile.title} 
              className="max-h-full max-w-full object-contain rounded border border-slate-200 shadow-sm" 
            />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button 
            onClick={onClose} 
            className="btn btn-sm h-8 px-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded"
          >
            Close
          </button>
          <a 
            href={typeof previewFile.data === 'string' && previewFile.data.startsWith('data:') ? previewFile.data : '#'} 
            download={previewFile.fileName}
            onClick={(e) => {
              if (typeof previewFile.data !== 'string' || !previewFile.data.startsWith('data:')) {
                e.preventDefault();
                alert("Simulated file downloaded package complete.");
              }
            }}
            className="btn btn-sm h-8 px-3.5 bg-[#0038A8] hover:bg-[#002d86] text-white border-none rounded text-xs font-medium shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download File
          </a>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
