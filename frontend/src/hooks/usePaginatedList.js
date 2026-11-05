import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchPage } from '../api/pagination';

export function usePaginatedList(queryKey, endpoint, params = {}, enabled = true) {
  const signature = JSON.stringify(params);
  const [position, setPosition] = useState({ signature, page: 1 });
  const page = position.signature === signature ? position.page : 1;
  if (position.signature !== signature) setPosition({ signature, page: 1 });
  const query = useQuery({
    queryKey: [queryKey, 'page', params, page],
    queryFn: ({ signal }) => fetchPage(endpoint, { ...params, page }, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
  const data = query.isError ? undefined : query.data;
  return {
    ...query,
    records: data?.results || [],
    summary: data?.summary || {},
    pagination: {
      page: data?.page || page,
      count: data?.count || 0,
      pageSize: data?.page_size || 10,
      hasNext: Boolean(data?.next),
      hasPrevious: Boolean(data?.previous),
      isFetching: query.isFetching,
      isError: query.isError,
      retry: query.refetch,
      setPage: nextPage => setPosition({ signature, page: nextPage }),
    },
  };
}
