import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import AccessibleDialog from '../../../components/common/AccessibleDialog';

const PreviewContent = ({ previewFile, onClose }) => {
  const [failed, setFailed] = useState(false);
  const source = typeof previewFile.data === 'string' ? previewFile.data : '';
  const hasAttachment = /^(https?:\/\/|\/(?!\/)|data:(image\/[^;,]+|application\/pdf)[;,])/i.test(source);
  const isPDF = /^data:application\/pdf[;,]/i.test(source) || /\.pdf(?:[?#]|$)/i.test(source) || /\.pdf$/i.test(previewFile.fileName || '');
  const isImage = /^data:image\//i.test(source) || /\.(png|jpe?g|gif|webp|avif|bmp|svg)(?:[?#]|$)/i.test(source) || /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(previewFile.fileName || '');

  return (
    <AccessibleDialog onClose={onClose} labelledBy="document-preview-title" describedBy="document-preview-description" className="bg-white rounded-lg border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="flex justify-between items-start gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h3 id="document-preview-title" className="text-base font-bold text-slate-900">{previewFile.title}</h3>
          <p id="document-preview-description" className="text-sm text-slate-700 mt-1 break-all">
            {previewFile.fileName || 'No attachment available'}
            {previewFile.local && ' (local browser copy, not verified)'}
          </p>
        </div>
        <button type="button" onClick={onClose} className="btn min-h-11 min-w-11 p-2 shrink-0" aria-label="Close preview">
          <X aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>
      <div className="h-[48vh] sm:h-[55vh] bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-3">
        {!hasAttachment ? (
          <p className="text-sm text-slate-700 text-center">No attachment is available. An identification number alone does not provide a document preview.</p>
        ) : failed ? (
          <p role="status" className="text-sm text-slate-700 text-center">Preview could not load. Use the file link below to open or download the attachment.</p>
        ) : isPDF ? (
          <iframe src={source} title={`${previewFile.title} PDF`} width="800" height="600" className="w-full h-full border-0" onError={() => setFailed(true)} />
        ) : isImage ? (
          <img src={source} alt={previewFile.title} width="800" height="600" className="w-full h-full object-contain" onError={() => setFailed(true)} />
        ) : (
          <p className="text-sm text-slate-700 text-center">This file type cannot be previewed here. Use the file link below.</p>
        )}
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
        <button type="button" onClick={onClose} className="btn min-h-11 px-4 text-sm">Close</button>
        {hasAttachment && (
          <a href={source} download={previewFile.fileName || 'attachment'} target="_blank" rel="noopener noreferrer" className="btn min-h-11 px-4 bg-[#0038A8] hover:bg-[#002d86] text-white text-sm">
            <Download aria-hidden="true" className="w-4 h-4" /> {source.startsWith('data:') ? 'Download attachment' : 'Open / download file'}
          </a>
        )}
      </div>
    </AccessibleDialog>
  );
};

const DocumentPreviewModal = ({ previewFile, onClose }) => previewFile
  ? <PreviewContent key={`${previewFile.title}-${previewFile.fileName}-${previewFile.local || false}`} previewFile={previewFile} onClose={onClose} />
  : null;

export default DocumentPreviewModal;
