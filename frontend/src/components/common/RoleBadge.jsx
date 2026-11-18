import React from 'react';
import { getRoleLabel, ROLE_BADGE_STYLES } from '../../utils/rbac';

/**
 * Standardized Role Badge Component
 * WCAG AA accessible color scheme matching DepEd brand palette.
 */
export default function RoleBadge({ role, isSuperuser = false, className = '', size = 'sm' }) {
  const label = isSuperuser ? 'System Administrator' : getRoleLabel(role);
  const colorClass = ROLE_BADGE_STYLES[role] || 'bg-slate-100 text-slate-700 border-slate-200';
  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${colorClass} ${sizeClass} ${className}`}
    >
      {label}
    </span>
  );
}
