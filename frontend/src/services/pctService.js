import api from './api';

export async function listPCT({
  search,
  professor,
  disciplina,
  turma,
  ano_lectivo,
  trimestre,
  nota_lancada,
  resultados_estado,
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
      resultados_estado: resultados_estado || undefined,
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

export async function listPCTAlunos(id) {
  const response = await api.get(`/pct/${id}/alunos/`);
  return response.data || [];
}

export async function listPCTResultados(id) {
  const response = await api.get(`/pct/${id}/resultados/`);
  return response.data || [];
}

export async function lancarNotasPCT(id, resultados) {
  const response = await api.post(`/pct/${id}/lancar-notas/`, { resultados });
  return response.data;
}

export async function previewImportacaoPCT(id, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(`/pct/${id}/importar-preview/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

export async function confirmarImportacaoPCT(id, rows) {
  const response = await api.post(`/pct/${id}/importar-confirmar/`, { rows });
  return response.data;
}
