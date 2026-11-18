import React from 'react';
import { Fingerprint, FileText } from 'lucide-react';
import { GOVERNMENT_IDS_LIST } from './constants';

const VerifiedIDsTab = ({
  me,
  documents,
  localIDs,
  canEdit = false,
  canVerify = false,
  busy = false,
  unavailable = false,
  onPreview,
  onTriggerUpload,
  onDelete,
  onVerify,
}) => (
  <div className="space-y-5">
    <div className="border-b border-slate-100 pb-3.5">
      <h3 className="text-base font-bold text-slate-900">Government Identification</h3>
      <p className="text-sm text-slate-600 mt-1">
        Identification numbers and saved attachments. Document review does not validate the identification number.
      </p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {GOVERNMENT_IDS_LIST.map((item) => {
        const attachment = documents?.[item.id];
        const legacy = localIDs?.[item.id];
        return (
          <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-4 min-w-0">
            <div className="flex gap-3 items-start">
              {attachment ? <FileText aria-hidden="true" className="w-5 h-5 text-[#0038A8] shrink-0" /> : <Fingerprint aria-hidden="true" className="w-5 h-5 text-slate-500 shrink-0" />}
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-slate-900">{item.label}</h4>
                <p className="text-sm text-slate-600">{item.desc}</p>
                <p className="text-sm font-mono text-slate-800 mt-2 break-all">{me?.[item.id] || 'Number not provided'}</p>
              </div>
            </div>
            <div className="text-sm text-slate-700 space-y-1 border-t border-slate-100 pt-3">
              <p>Status: {unavailable ? 'Saved attachment status unavailable' : attachment ? (attachment.verified ? 'Document verified' : 'Document not verified') : 'No saved attachment'}</p>
              {attachment && (
                <>
                  <p className="break-all">File: {attachment.fileName}</p>
                  {attachment.uploadDate && <p>Uploaded: {attachment.uploadDate}</p>}
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onPreview(item)} className="btn min-h-11 px-3 text-sm">
                {attachment ? 'Preview attachment' : 'Attachment details'}
              </button>
              {canEdit && (
                <button type="button" disabled={busy} onClick={() => onTriggerUpload(item.id)} className="btn min-h-11 px-3 text-sm bg-[#0038A8] hover:bg-[#002d86] text-white">
                  {attachment ? 'Replace attachment' : 'Upload attachment'}
                </button>
              )}
              {canEdit && attachment && (
                <button type="button" disabled={busy} onClick={() => onDelete(item.id)} className="btn min-h-11 px-3 text-sm text-red-700">
                  Remove saved attachment
                </button>
              )}
              {canVerify && attachment && (
                <button type="button" disabled={busy} onClick={() => onVerify(item.id, !attachment.verified)} className="btn min-h-11 px-3 text-sm">
                  {attachment.verified ? 'Revoke document verification' : 'Verify document'}
                </button>
              )}
            </div>
            {legacy && (
              <div className="border-t border-slate-200 pt-3 space-y-2 text-sm text-slate-700">
                <p className="font-semibold">Local attachment retained</p>
                <p className="break-all">{legacy.fileName || 'Previous attachment'}</p>
                <p>This copy is stored only in this browser, not saved to the employee record or verified. Download it before clearing browser data.</p>
                <button type="button" onClick={() => onPreview(item, true)} className="btn min-h-11 px-3 text-sm">View local attachment</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default VerifiedIDsTab;
