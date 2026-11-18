import {
  Users,
  Clock,
  FileText,
  HandCoins,
  Wallet,
  Award,
  UserPlus,
  School,
  CheckCircle,
} from 'lucide-react';

export const DASHBOARD_TITLES = {
  ACCOUNTANT: 'Finance dashboard',
  HR: 'HR operations dashboard',
  SUPERINTENDENT: 'Division operations dashboard',
  PRINCIPAL: 'School workspace',
  ADMIN: 'System administration dashboard',
  PERSONAL: 'My dashboard',
};

export const DE_PED_PALETTE = [
  '#0038A8', // DepEd Blue
  '#0A225C', // DepEd Navy
  '#0284C7', // Sky Blue
  '#15803D', // Emerald Green
  '#B45309', // Amber
  '#6366F1', // Indigo
  '#475569', // Slate
  '#BE185D', // Pink/Rose
];

export const METRIC_CONFIG = {
  workforce: {
    icon: Users,
    color: 'text-[#0038A8]',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'DepEd Plantilla',
  },
  attendance: {
    icon: Clock,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'CSC Form 48 DTR',
  },
  leaves: {
    icon: FileText,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'CSC Form No. 6',
  },
  loans: {
    icon: HandCoins,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    badge: 'Provident Fund',
  },
  payroll_status: {
    icon: CheckCircle,
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    badge: 'Cycle Status',
  },
  payroll: {
    icon: Wallet,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'Net Compensation',
  },
  performance: {
    icon: Award,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    badge: 'RPMS / IPCRF',
  },
  recruitment: {
    icon: UserPlus,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'RQA Pipeline',
  },
  stations: {
    icon: School,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    badge: 'School Clusters',
  },
};

const DIVISION_ORDER = [
  'workforce',
  'attendance',
  'leaves',
  'recruitment',
  'stations',
  'loans',
  'payroll_status',
  'payroll',
  'performance',
];

const PERSONAL_ORDER = [
  'attendance',
  'leaves',
  'loans',
  'payroll_status',
  'payroll',
  'performance',
];

// Chart order follows each role's review workflow so the first panel answers its main question.
const ROLE_CHART_ORDER = {
  ADMIN: ['workforce', 'stations', 'recruitment', 'leaves', 'attendance', 'loans', 'payroll_status', 'payroll', 'performance'],
  HR: ['workforce', 'attendance', 'leaves', 'recruitment', 'stations', 'loans', 'payroll_status', 'payroll', 'performance'],
  ACCOUNTANT: ['payroll', 'payroll_status', 'loans'],
  SUPERINTENDENT: ['workforce', 'leaves', 'payroll_status', 'attendance', 'loans', 'performance', 'recruitment', 'stations', 'payroll'],
  PRINCIPAL: PERSONAL_ORDER,
  TEACHING: PERSONAL_ORDER,
  NON_TEACHING: PERSONAL_ORDER,
};

const ROLE_KPI_KEYS = {
  ADMIN: ['workforce', 'leaves', 'recruitment', 'payroll_status'],
  HR: ['workforce', 'attendance', 'leaves', 'recruitment'],
  ACCOUNTANT: ['payroll', 'payroll_status', 'loans'],
  SUPERINTENDENT: ['workforce', 'leaves', 'payroll_status', 'loans'],
  PRINCIPAL: ['leaves', 'attendance', 'loans', 'payroll'],
  TEACHING: ['leaves', 'attendance', 'loans', 'payroll'],
  NON_TEACHING: ['leaves', 'attendance', 'loans', 'payroll'],
};

function roleKey(user) {
  if (user?.is_superuser) return 'ADMIN';
  return user?.role || 'PERSONAL';
}

export function dashboardTitle(user) {
  if (!user) return DASHBOARD_TITLES.PERSONAL;
  if (user.is_superuser) return DASHBOARD_TITLES.ADMIN;
  return DASHBOARD_TITLES[user.role] || DASHBOARD_TITLES.PERSONAL;
}

export function orderedCharts(charts, user) {
  const role = roleKey(user);
  const priority = ROLE_CHART_ORDER[role] || (user?.is_management ? DIVISION_ORDER : PERSONAL_ORDER);
  const rank = new Map(priority.map((key, index) => [key, index]));
  return [...charts].sort((left, right) => {
    const leftRank = rank.get(left.key) ?? priority.length;
    const rightRank = rank.get(right.key) ?? priority.length;
    return leftRank - rightRank;
  });
}

export function kpiCharts(charts, user) {
  const keys = ROLE_KPI_KEYS[roleKey(user)] || ROLE_KPI_KEYS.TEACHING;
  return keys.map(key => charts.find(chart => chart.key === key)).filter(Boolean);
}

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
