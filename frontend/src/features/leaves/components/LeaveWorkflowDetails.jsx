import { formatLeaveStatus } from '../utils/leaveWorkflow';

export default function LeaveWorkflowDetails({ leave }) {
  return (
    <section className="space-y-3 rounded border border-slate-200 p-4 text-xs text-slate-700" aria-label="Application progress">
      <h4 className="font-semibold text-slate-900">Application progress</h4>
      <p className="font-medium">{formatLeaveStatus(leave.status)}</p>
      {leave.workflow === 'teaching' && (
        <>
          <p>Principal approval and signature → HR completion</p>
          <dl className="grid gap-1 sm:grid-cols-2">
            <div><dt className="text-slate-500">Assigned Principal</dt><dd>{leave.assigned_principal_name || 'Not assigned'}</dd></div>
          </dl>
        </>
      )}
      {leave.correction_reason && <p className="rounded bg-amber-50 p-3 text-amber-900">Correction needed: {leave.correction_reason}</p>}
      {leave.disapproval_reason && <p className="text-red-800">Disapproval reason: {leave.disapproval_reason}</p>}
      {leave.principal_signature && (
        <figure className="rounded border border-slate-200 bg-white p-3">
          <img src={leave.principal_signature} alt="Principal's signature on this application" className="max-h-24 max-w-full object-contain" />
          <figcaption className="mt-2 text-slate-600">Signed by {leave.principal_signer_name} on {new Date(leave.principal_signed_at).toLocaleString()}</figcaption>
        </figure>
      )}
      {leave.records_reference && <p>Records reference: <strong>{leave.records_reference}</strong></p>}
      <ol className="space-y-3 border-l-2 border-slate-200 pl-3">
        {(leave.actions || []).map(action => (
          <li key={action.id}>
            <p className="font-medium text-slate-900">{action.actor_name} · {formatLeaveStatus(action.to_status)}</p>
            <time className="text-slate-500" dateTime={action.created_at}>{new Date(action.created_at).toLocaleString()}</time>
            <p className="mt-1 break-words">{action.note}</p>
            {action.signature && <a href={action.signature} target="_blank" rel="noreferrer" className="text-primary underline">View signature for this action</a>}
          </li>
        ))}
      </ol>
    </section>
  );
}
