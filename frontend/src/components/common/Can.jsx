import React from 'react';
import { useRBAC } from '../../hooks/useRBAC';

/**
 * Declarative Authorization Gate Component
 * 
 * Usage:
 *   <Can permission={PERMISSIONS.MANAGE_EMPLOYEES}>
 *     <button>Add Employee</button>
 *   </Can>
 * 
 *   <Can roles={['HR', 'SUPERINTENDENT']} fallback={<p>Unauthorized</p>}>
 *     <SecretPanel />
 *   </Can>
 */
export default function Can({ permission, roles, fallback = null, children }) {
  const { can, hasRole } = useRBAC();

  if (permission && can(permission)) {
    return <>{children}</>;
  }

  if (roles && hasRole(roles)) {
    return <>{children}</>;
  }

  return fallback;
}
