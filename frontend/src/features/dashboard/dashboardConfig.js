// Chart series stay inside the DepEd blue/navy/slate tokens. Yellow stays reserved for the accent moment.
export const CHART_COLORS = ['#0038A8', '#0A225C', '#0284C7', '#475569'];

export const METRIC_CONFIG = {
  workforce: { sourceLabel: 'DepEd Plantilla' },
  attendance: { sourceLabel: 'CSC Form 48 DTR' },
  leaves: { sourceLabel: 'CSC Form No. 6' },
  loans: { sourceLabel: 'Provident Fund' },
  payroll_status: { sourceLabel: 'Cycle Status' },
  payroll: { sourceLabel: 'Net Compensation' },
  performance: { sourceLabel: 'RPMS / IPCRF' },
  recruitment: { sourceLabel: 'RQA Pipeline' },
  stations: { sourceLabel: 'School Clusters' },
};

export function formatChartValue(value, unit) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  if (unit === 'PHP') {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 2,
    }).format(number);
  }
  return number.toLocaleString();
}

export function formatAxisValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  if (Math.abs(number) >= 1000) return `${Number(number / 1000).toLocaleString()}k`;
  return number.toLocaleString();
}

export function truncateLabel(value) {
  const label = String(value || 'Not recorded');
  return label.length > 20 ? `${label.slice(0, 19)}…` : label;
}
