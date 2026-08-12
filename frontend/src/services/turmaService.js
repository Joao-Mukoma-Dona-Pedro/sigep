import api from './api';

export async function listTurmas({ search, estado, periodo, ano_lectivo, ordering, page = 1 } = {}) {
  const response = await api.get('/turmas/', {
    params: {
      search: search || undefined,
      estado: estado || undefined,
      periodo: periodo || undefined,
      ano_lectivo: ano_lectivo || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getTurma(id) {
  const response = await api.get(`/turmas/${id}/`);
  return response.data;
}

export async function createTurma(data) {
  const response = await api.post('/turmas/', data);
  return response.data;
}

export async function updateTurma(id, data) {
  const response = await api.put(`/turmas/${id}/`, data);
  return response.data;
}

export async function deleteTurma(id) {
  await api.delete(`/turmas/${id}/`);
}

export async function listProfessorOptions() {
  const response = await api.get('/professores/', {
    params: {
      estado: 'ATIVO',
      ordering: 'nome',
      page_size: 100,
    },
  });

  return response.data.results || [];
}
