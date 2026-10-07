import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ROLES, 
  ROLE_GROUPS, 
  PERMISSIONS, 
  hasPermission, 
  hasAnyRole, 
  getRoleLabel,
  ROLE_BADGE_STYLES 
} from '../utils/rbac';

/**
 * useRBAC Hook
 * Provides memoized role checks, capability queries, and labels for current session.
 */
export function useRBAC() {
  const { user, loading } = useAuth();

  const can = useCallback(
    (permissionName) => hasPermission(user, permissionName),
    [user]
  );

  const hasRole = useCallback(
    (...roles) => hasAnyRole(user, roles.flat()),
    [user]
  );

  const role = user?.role;
  const isSuperuser = Boolean(user?.is_superuser);

  return {
    user,
    loading,
    role,
    isSuperuser,
    // Role Checks
    isManagement: hasAnyRole(user, ROLE_GROUPS.MANAGEMENT),
    isAdmin: role === ROLES.ADMINISTRATIVE,
    isHR: role === ROLES.HR,
    isSuperintendent: role === ROLES.SUPERINTENDENT,
    isAccountant: role === ROLES.ACCOUNTANT,
    isTeaching: role === ROLES.TEACHING,
    isNonTeaching: role === ROLES.NON_TEACHING,
    // Capability Matrix
    can,
    hasRole,
    // Helpers
    roleLabel: getRoleLabel(role),
    roleBadgeClass: ROLE_BADGE_STYLES[role] || 'bg-slate-100 text-slate-700 border-slate-200',
  };
}

export { ROLES, ROLE_GROUPS, PERMISSIONS };
