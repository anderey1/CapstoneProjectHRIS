import api from './axios';

export async function fetchPage(endpoint, params = {}, signal) {
  const requestedPage = params.page || 1;
  try {
    const { data } = await api.get(endpoint, { params, signal });
    return { ...data, page: requestedPage };
  } catch (error) {
    // A deletion can remove the last page while the user is viewing it.
    if (error.response?.status === 404 && requestedPage > 1) {
      const { data } = await api.get(endpoint, { params: { ...params, page: 1 }, signal });
      return { ...data, page: 1 };
    }
    throw error;
  }
}

export async function fetchAllPages(endpoint, params = {}, signal) {
  const records = [];
  let page = 1;
  while (true) {
    const { data } = await api.get(endpoint, { params: { ...params, page }, signal });
    if (Array.isArray(data)) return data;
    records.push(...data.results);
    if (!data.next) return records;
    page += 1;
  }
}
