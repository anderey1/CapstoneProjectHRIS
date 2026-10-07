import React from 'react';
import { getRoleLabel, ROLE_BADGE_STYLES } from '../../utils/rbac';

/**
 * Standardized Role Badge Component
 * WCAG AA accessible color scheme matching DepEd brand palette.
 */
export default function RoleBadge({ role, className = '', size = 'sm' }) {
  const label = getRoleLabel(role);
  const colorClass = ROLE_BADGE_STYLES[role] || 'bg-slate-100 text-slate-700 border-slate-200';
  const sizeClass = size === 'xs' ? 'text-[9px] px-1.5 py-0.2' : 'text-[10px] px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border ${colorClass} ${sizeClass} ${className}`}
    >
      {label}
    </span>
  );
}
