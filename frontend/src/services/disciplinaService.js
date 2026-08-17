import api from './api';

export async function listDisciplinas({ search, estado, ordering, page = 1 } = {}) {
  const response = await api.get('/disciplinas/', {
    params: {
      search: search || undefined,
      estado: estado || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getDisciplina(id) {
  const response = await api.get(`/disciplinas/${id}/`);
  return response.data;
}

export async function createDisciplina(data) {
  const response = await api.post('/disciplinas/', data);
  return response.data;
}

export async function updateDisciplina(id, data) {
  const response = await api.put(`/disciplinas/${id}/`, data);
  return response.data;
}

export async function deleteDisciplina(id) {
  await api.delete(`/disciplinas/${id}/`);
}
