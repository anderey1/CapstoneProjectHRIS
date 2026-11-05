import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/axios';
import { QUERY_KEYS } from '../../../api/queryKeys';

export function useSchools(page) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [QUERY_KEYS.SCHOOLS, { page }],
    queryFn: async ({ signal }) => (await api.get('schools/', { params: { page }, signal })).data,
  });
  const mutation = useMutation({
    mutationFn: async ({ action, id, values }) => {
      if (action === 'delete') return api.delete(`schools/${id}/`);
      if (id) return api.patch(`schools/${id}/`, values);
      return api.post('schools/', values);
    },
    onSuccess: async () => {
      await Promise.all([
        QUERY_KEYS.SCHOOLS, QUERY_KEYS.EMPLOYEES, QUERY_KEYS.ME, QUERY_KEYS.AUDIT_LOGS,
      ].map(key => client.invalidateQueries({ queryKey: [key] })));
    },
  });
  return { query, mutation };
}
