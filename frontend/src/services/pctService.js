import api from './api';

export async function listPCT({
  search,
  professor,
  disciplina,
  turma,
  ano_lectivo,
  trimestre,
  nota_lancada,
  data_aplicacao,
  ordering,
  page = 1,
} = {}) {
  const response = await api.get('/pct/', {
    params: {
      search: search || undefined,
      professor: professor || undefined,
      disciplina: disciplina || undefined,
      turma: turma || undefined,
      ano_lectivo: ano_lectivo || undefined,
      trimestre: trimestre || undefined,
      nota_lancada: nota_lancada || undefined,
      data_aplicacao: data_aplicacao || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getPCT(id) {
  const response = await api.get(`/pct/${id}/`);
  return response.data;
}

export async function createPCT(data) {
  const response = await api.post('/pct/', data);
  return response.data;
}

export async function updatePCT(id, data) {
  const response = await api.put(`/pct/${id}/`, data);
  return response.data;
}

export async function deletePCT(id) {
  await api.delete(`/pct/${id}/`);
}

export async function listPCTLecionacaoOptions() {
  const response = await api.get('/pct/lecionacoes/');
  return response.data || [];
}
