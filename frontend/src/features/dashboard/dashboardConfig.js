import {
  Award,
  Banknote,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  History,
  Landmark,
  School,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';

// Chart series stay inside the DepEd blue/navy/slate tokens. Yellow stays reserved for the accent moment.
export const CHART_COLORS = ['#0038A8', '#0A225C', '#0284C7', '#475569'];

export const METRIC_CONFIG = {
  workforce: { sourceLabel: 'DepEd Plantilla', icon: Users },
  attendance: { sourceLabel: 'CSC Form 48 DTR', icon: CalendarCheck },
  leaves: { sourceLabel: 'CSC Form No. 6', icon: CalendarDays },
  loans: { sourceLabel: 'Provident Fund', icon: Landmark },
  payroll_status: { sourceLabel: 'Cycle Status', icon: ClipboardCheck },
  payroll: { sourceLabel: 'Net Compensation', icon: Banknote },
  performance: { sourceLabel: 'RPMS / IPCRF', icon: Award },
  recruitment: { sourceLabel: 'RQA Applicants', icon: UserPlus },
  stations: { sourceLabel: 'School Clusters', icon: School },
  accounts: { sourceLabel: 'User Directory', icon: UserCog },
  registrations: { sourceLabel: 'Onboarding Queue', icon: UserCheck },
  audit_activity: { sourceLabel: 'System Audit Log', icon: History },
  school_configuration: { sourceLabel: 'School Registry', icon: Building2 },
  account_status: { sourceLabel: 'Account Access', icon: ShieldCheck },
};

export const SCOPE_META = {
  personal: { label: 'Personal records' },
  system: { label: 'System records' },
  division: { label: 'Division records' },
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
