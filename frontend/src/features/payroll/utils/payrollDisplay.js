export const unavailable = 'Not available';

export function formatCurrency(value) {
  if (!['string', 'number'].includes(typeof value) || String(value).trim() === '') return unavailable;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return unavailable;
  return `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Sum recorded amounts only. Missing amounts must not become zero or inferred pay.
export function sumRecordedAmounts(records, field) {
  let cents = 0n;
  for (const record of records) {
    const value = record[field];
    if (value === null || value === undefined || !/^-?\d+(?:\.\d{1,2})?$/.test(String(value))) return null;
    const [whole, fraction = ''] = String(value).replace('-', '').split('.');
    cents += (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))) * (String(value).startsWith('-') ? -1n : 1n);
  }
  const absolute = cents < 0n ? -cents : cents;
  return `${cents < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}

export const payrollStatusLabel = status => ({
  draft: 'Draft',
  approved: 'Approved',
  released: 'Released',
  unprepared: 'Not prepared',
  unavailable: 'Status unavailable',
}[status] || 'Status unavailable');
