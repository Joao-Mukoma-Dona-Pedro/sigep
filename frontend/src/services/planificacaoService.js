import api from './api';

export async function listPlanificacoes({
  search,
  professor,
  trimestre,
  entregou,
  data_inicio,
  data_fim,
  ordering,
  page = 1,
} = {}) {
  const response = await api.get('/planificacoes/', {
    params: {
      search: search || undefined,
      professor: professor || undefined,
      trimestre: trimestre || undefined,
      entregou: entregou || undefined,
      data_inicio: data_inicio || undefined,
      data_fim: data_fim || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getPlanificacao(id) {
  const response = await api.get(`/planificacoes/${id}/`);
  return response.data;
}

export async function createPlanificacao(data) {
  const response = await api.post('/planificacoes/', data);
  return response.data;
}

export async function updatePlanificacao(id, data) {
  const response = await api.put(`/planificacoes/${id}/`, data);
  return response.data;
}

export async function deletePlanificacao(id) {
  await api.delete(`/planificacoes/${id}/`);
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
