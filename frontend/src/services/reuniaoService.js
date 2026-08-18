import api from './api';

export async function listReunioes({ search, data, ordering, page = 1 } = {}) {
  const response = await api.get('/reunioes/', {
    params: {
      search: search || undefined,
      data: data || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getReuniao(id) {
  const response = await api.get(`/reunioes/${id}/`);
  return response.data;
}

export async function createReuniao(data) {
  const response = await api.post('/reunioes/', data);
  return response.data;
}

export async function updateReuniao(id, data) {
  const response = await api.put(`/reunioes/${id}/`, data);
  return response.data;
}

export async function deleteReuniao(id) {
  await api.delete(`/reunioes/${id}/`);
}
