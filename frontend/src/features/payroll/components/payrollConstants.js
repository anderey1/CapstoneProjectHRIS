export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function createCutoff(year, month, half) {
  if (!Number.isInteger(year) || year < 1000 || year > 9999 || !Number.isInteger(month) || month < 0 || month > 11 || ![1, 2].includes(half)) return null;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return `${MONTHS[month]} ${half === 1 ? '1-15' : `16-${lastDay}`}, ${year}`;
}

export function currentCutoff(date = new Date()) {
  return createCutoff(date.getFullYear(), date.getMonth(), date.getDate() <= 15 ? 1 : 2);
}

// Kept as an export for existing consumers; selectable periods come from records.
export const CUTOFF_PERIODS = [];

export const getCutoffStatus = (payrolls = []) => {
  if (payrolls.length === 0) return 'unprepared';
  if (payrolls.some(p => !['draft', 'approved', 'released'].includes(p.status))) return 'unavailable';
  const hasDraft = payrolls.some(p => p.status === 'draft');
  const hasApproved = payrolls.some(p => p.status === 'approved');
  const allReleased = payrolls.every(p => p.status === 'released');
  
  if (allReleased) return 'released';
  if (hasDraft) return 'draft';
  if (hasApproved) return 'approved';
  return 'unavailable';
};
