export const PENDING_LEAVE_STATUSES = [
  'pending_supervisor', 'pending_hr', 'pending_superintendent',
];

export const formatLeaveStatus = (status) => ({
  pending_checking: 'For Assistant II checking',
  pending_supervisor: 'For Principal / Supervisor',
  pending_records: 'For Records Unit',
  pending_hr: 'For HR processing',
  pending_superintendent: 'For Superintendent',
  returned: 'Returned for correction',
  approved: 'Approved / Completed',
  rejected: 'Disapproved',
}[status] || status);

export const leaveActionLabel = (leave) => {
  if (leave.workflow === 'teaching') {
    return {
      pending_supervisor: 'Approve & sign',
      pending_hr: 'Complete HR processing',
    }[leave.status];
  }
  return {
    pending_supervisor: 'Recommend approval',
    pending_hr: 'Verify & certify',
    pending_superintendent: 'Final approve',
  }[leave.status];
};
