import api from './api';

export async function listPlanificacoes({
  search,
  professor,
  disciplina,
  turma,
  ano_lectivo,
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
      disciplina: disciplina || undefined,
      turma: turma || undefined,
      ano_lectivo: ano_lectivo || undefined,
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

export async function listPlanificacaoLecionacaoOptions() {
  const response = await api.get('/planificacoes/lecionacoes/');
  return response.data || [];
}
