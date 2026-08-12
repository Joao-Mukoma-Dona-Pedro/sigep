import api from './api';

export async function listProfessores({ search, estado, ordering, page = 1 } = {}) {
  const response = await api.get('/professores/', {
    params: {
      search: search || undefined,
      estado: estado || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getProfessor(id) {
  const response = await api.get(`/professores/${id}/`);
  return response.data;
}

export async function createProfessor(data) {
  const response = await api.post('/professores/', data);
  return response.data;
}

export async function updateProfessor(id, data) {
  const response = await api.put(`/professores/${id}/`, data);
  return response.data;
}

export async function deleteProfessor(id) {
  await api.delete(`/professores/${id}/`);
}
