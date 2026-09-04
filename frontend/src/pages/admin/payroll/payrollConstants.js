export const CUTOFF_PERIODS = [
  "May 1-15, 2026",
  "May 16-31, 2026",
  "June 1-15, 2026",
  "June 16-30, 2026"
];

export const getCutoffStatus = (payrolls = []) => {
  if (payrolls.length === 0) return 'unprepared';
  const hasDraft = payrolls.some(p => p.status === 'draft');
  const hasApproved = payrolls.some(p => p.status === 'approved');
  const allReleased = payrolls.every(p => p.status === 'released');
  
  if (allReleased) return 'released';
  if (hasDraft) return 'draft';
  if (hasApproved) return 'approved';
  return 'unprepared';
};
