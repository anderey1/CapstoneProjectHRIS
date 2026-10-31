/**
 * Centralized Role-Based Access Control (RBAC) System
 * DepEd Lucena City Division HRIS
 */

export const ROLES = {
  HR: 'HR',
  ACCOUNTANT: 'ACCOUNTANT',
  SUPERINTENDENT: 'SUPERINTENDENT',
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  TEACHING: 'TEACHING',
  NON_TEACHING: 'NON_TEACHING',
};

// Canonical role tiers (mirrors backend MANAGEMENT_ROLES and permissions.py)
export const ROLE_GROUPS = {
  MANAGEMENT: [
    ROLES.HR,
    ROLES.ACCOUNTANT,
    ROLES.SUPERINTENDENT,
    ROLES.ADMINISTRATIVE,
  ],
  OPERATIONS: [
    ROLES.HR,
    ROLES.SUPERINTENDENT,
    ROLES.ADMINISTRATIVE,
  ],
  FINANCE: [
    ROLES.ACCOUNTANT,
    ROLES.SUPERINTENDENT,
    ROLES.ADMINISTRATIVE,
  ],
  STAFF: [
    ROLES.TEACHING,
    ROLES.NON_TEACHING,
    ROLES.ADMINISTRATIVE,
  ],
  ALL: Object.values(ROLES),
};

// Official DepEd Human-Readable Role Labels
export const ROLE_LABELS = {
  [ROLES.HR]: 'HR Officer',
  [ROLES.ACCOUNTANT]: 'Division Accountant',
  [ROLES.SUPERINTENDENT]: 'Schools Division Superintendent',
  [ROLES.ADMINISTRATIVE]: 'Administrative Staff',
  [ROLES.TEACHING]: 'Teaching Staff',
  [ROLES.NON_TEACHING]: 'Non-Teaching Staff',
};

// WCAG AA Compliant Role Badges (DepEd Palette)
export const ROLE_BADGE_STYLES = {
  [ROLES.HR]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [ROLES.ACCOUNTANT]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ROLES.SUPERINTENDENT]: 'bg-amber-50 text-amber-800 border-amber-300',
  [ROLES.ADMINISTRATIVE]: 'bg-blue-50 text-[#0038A8] border-blue-200',
  [ROLES.TEACHING]: 'bg-teal-50 text-teal-700 border-teal-200',
  [ROLES.NON_TEACHING]: 'bg-slate-100 text-slate-700 border-slate-200',
};

// Granular Capability / Permission Matrix
export const PERMISSIONS = {
  // Employee Directory
  MANAGE_EMPLOYEES: [ROLES.HR, ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE],
  MANAGE_REGISTRATIONS: [ROLES.HR, ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE],

  // Provident Loans
  VERIFY_LOANS: [ROLES.ACCOUNTANT, ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE],
  APPROVE_LOANS: [ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE, ROLES.HR],
  DISBURSE_LOANS: [ROLES.ACCOUNTANT, ROLES.ADMINISTRATIVE],
  POST_LOAN_PAYMENTS: [ROLES.ACCOUNTANT, ROLES.ADMINISTRATIVE, ROLES.HR],

  // Attendance & DTR (Form 48)
  APPROVE_DTR: [ROLES.HR, ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE],
  EXPORT_DTR_STAFF: [ROLES.HR, ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE],

  // Leaves (CSC Form 6)
  MANAGE_LEAVES: [ROLES.HR, ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE],

  // Payroll
  MANAGE_PAYROLL: [ROLES.ACCOUNTANT, ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE, ROLES.HR],
  APPROVE_PAYROLL: [ROLES.SUPERINTENDENT],

  // Performance (IPCRF)
  RATE_PERFORMANCE: [ROLES.HR, ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE],

  // Activity / Audit Logs
  VIEW_AUDIT_LOGS: [ROLES.HR, ROLES.ACCOUNTANT, ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE],

  // Recruitment & Applicants
  MANAGE_RECRUITMENT: [ROLES.HR, ROLES.SUPERINTENDENT, ROLES.ADMINISTRATIVE],

  // PDS Extraction
  EXTRACT_PDS: [ROLES.HR],
};

/**
 * Checks if a user has a specific permission.
 */
export function hasPermission(user, permissionName) {
  if (!user) return false;
  if (user.is_superuser) return true;
  const allowed = PERMISSIONS[permissionName];
  if (!allowed) return false;
  return allowed.includes(user.role);
}

/**
 * Checks if a user has any of the specified roles.
 */
export function hasAnyRole(user, roles) {
  if (!user) return false;
  if (user.is_superuser) return true;
  if (!roles || roles.length === 0) return true;
  return roles.includes(user.role);
}

/**
 * Returns formatted role display label.
 */
export function getRoleLabel(role) {
  if (!role) return 'Staff';
  return ROLE_LABELS[role] || role.replace('_', ' ');
}
