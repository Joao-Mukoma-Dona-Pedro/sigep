import api from './api';

export async function listLecionacoes({
  search,
  professor,
  disciplina,
  turma,
  classe,
  ano_lectivo,
  estado,
  ordering,
  page = 1,
} = {}) {
  const response = await api.get('/lecionacoes/', {
    params: {
      search: search || undefined,
      professor: professor || undefined,
      disciplina: disciplina || undefined,
      turma: turma || undefined,
      classe: classe || undefined,
      ano_lectivo: ano_lectivo || undefined,
      estado: estado || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getLecionacao(id) {
  const response = await api.get(`/lecionacoes/${id}/`);
  return response.data;
}

export async function createLecionacao(data) {
  const response = await api.post('/lecionacoes/', data);
  return response.data;
}

export async function updateLecionacao(id, data) {
  const response = await api.put(`/lecionacoes/${id}/`, data);
  return response.data;
}

export async function deleteLecionacao(id) {
  await api.delete(`/lecionacoes/${id}/`);
}

export async function listLecionacaoProfessores() {
  const response = await api.get('/lecionacoes/professores/');
  return response.data || [];
}

export async function listLecionacaoDisciplinas() {
  const response = await api.get('/lecionacoes/disciplinas/');
  return response.data || [];
}

export async function listLecionacaoTurmas() {
  const response = await api.get('/lecionacoes/turmas/');
  return response.data || [];
}
