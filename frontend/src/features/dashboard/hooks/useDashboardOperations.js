import { useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';
import { ROLE_LABELS } from '../../../utils/rbac';

export default function useDashboardOperations(user) {
  const client = useQueryClient();
  const tasksFetching = useIsFetching({ queryKey: [QUERY_KEYS.NOTIFICATIONS, user?.id, 'tasks'] });

  // 1. Unified Operational Dashboard Data from Backend
  const query = useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_OPERATIONS, user?.id, user?.role],
    queryFn: ({ signal }) =>
      api.get('dashboard/operations/', { signal, timeout: 15000 }).then((response) => response.data),
    staleTime: 60000,
    retry: false,
  });

  // 2. Personal Employee Profile from Backend (if account has associated personnel record)
  const { data: meProfile } = useQuery({
    queryKey: [QUERY_KEYS.ME, user?.id],
    queryFn: () => api.get('employees/me/').then((res) => res.data).catch(() => null),
    staleTime: 60000,
    retry: false,
  });

  const roleLabel =
    user?.is_superuser
      ? 'System Administrator'
      : ROLE_LABELS[user?.role] || user?.role || 'Staff Member';

  const isRefreshing = query.isFetching || tasksFetching > 0;

  const refresh = () => {
    query.refetch();
    client.invalidateQueries({ queryKey: [QUERY_KEYS.ME, user?.id] });
    client.invalidateQueries({ queryKey: [QUERY_KEYS.NOTIFICATIONS, user?.id] });
  };

  const charts = Array.isArray(query.data?.charts) ? query.data.charts : [];
  const hasPersonalCredits =
    query.data?.scope === 'personal' &&
    meProfile &&
    (meProfile.vacation_leave_balance !== undefined || meProfile.sick_leave_balance !== undefined);

  return { query, meProfile, charts, roleLabel, isRefreshing, refresh, hasPersonalCredits };
}
