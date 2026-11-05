import { useEffect, useId, useState } from 'react';
import { leaveActionLabel, formatLeaveStatus } from '../utils/leaveWorkflow';

export default function LeaveProcessingActions({ leave, onApprove, onReject, onReturn, pending, onComplete }) {
  const [signature, setSignature] = useState(null);
  const [preview, setPreview] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const inputId = useId();
  const needsSignature = leave.workflow === 'teaching' && leave.status === 'pending_supervisor';

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  if (!leave.can_approve) {
    return <p className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">Current stage: {formatLeaveStatus(leave.status)}. Awaiting the assigned processor.</p>;
  }

  const submit = async (action) => {
    setError('');
    if (action !== 'approve' && !reason.trim()) {
      setError('Enter a reason before returning or disapproving the application.');
      return;
    }
    if (action === 'approve' && needsSignature && (!signature || !confirmed)) {
      setError('Upload your signature and confirm approval.');
      return;
    }
    try {
      if (action === 'approve') {
        await onApprove({ id: leave.id, signature, signatureConfirmed: confirmed, expectedStatus: leave.status });
      } else if (action === 'return') {
        await onReturn({ id: leave.id, reason: reason.trim() });
      } else {
        await onReject({ id: leave.id, reason: reason.trim() });
      }
      onComplete();
    } catch {
      // The request hook shows the server's error; keep the dialog open for retry.
    }
  };

  return (
    <section className="space-y-4 rounded border border-slate-200 bg-slate-50 p-4 text-xs" aria-label="Process application">
      <h4 className="font-semibold text-slate-900">Action on application</h4>
      {needsSignature && (
        <div className="space-y-3">
          <label className="block font-medium" htmlFor={`${inputId}-signature`}>Principal signature image (PNG or JPEG, up to 2 MB)</label>
          <input id={`${inputId}-signature`} type="file" accept="image/png,image/jpeg" className="file-input file-input-bordered file-input-sm w-full" onChange={event => {
            const file = event.target.files?.[0];
            setSignature(null);
            setPreview('');
            setConfirmed(false);
            if (file && (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024)) {
              setError('Choose a PNG or JPEG image no larger than 2 MB.');
              return;
            }
            setError('');
            setSignature(file || null);
            setPreview(file ? URL.createObjectURL(file) : '');
          }} />
          {preview && <img src={preview} alt="Your signature preview" className="max-h-24 max-w-full rounded border border-slate-200 bg-white p-2 object-contain" />}
          <label className="flex items-start gap-2">
            <input type="checkbox" className="checkbox checkbox-sm" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
            <span>This is my signature. I approve this leave application and authorize attaching it to this record.</span>
          </label>
        </div>
      )}
      <div>
        <label className="mb-1 block font-medium" htmlFor={`${inputId}-reason`}>Reason (required for correction or disapproval)</label>
        <textarea id={`${inputId}-reason`} className="textarea textarea-bordered w-full text-sm" rows={2} value={reason} onChange={event => setReason(event.target.value)} />
      </div>
      {error && <p role="alert" className="text-red-800">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        {leave.workflow === 'teaching' && <button type="button" className="btn btn-sm btn-outline" disabled={pending} onClick={() => submit('return')}>Return for correction</button>}
        <button type="button" className="btn btn-sm btn-outline btn-error" disabled={pending} onClick={() => submit('reject')}>Disapprove</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={pending} onClick={() => submit('approve')}>{pending ? 'Processing...' : leaveActionLabel(leave)}</button>
      </div>
    </section>
  );
}
