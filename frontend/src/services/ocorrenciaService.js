import api from './api';

export async function listOcorrencias({
  search,
  aluno,
  turma,
  tipo,
  categoria,
  registada_por,
  data_inicio,
  data_fim,
  ordering,
  page = 1,
} = {}) {
  const response = await api.get('/ocorrencias/', {
    params: {
      search: search || undefined,
      aluno: aluno || undefined,
      turma: turma || undefined,
      tipo: tipo || undefined,
      categoria: categoria || undefined,
      registada_por: registada_por || undefined,
      data_inicio: data_inicio || undefined,
      data_fim: data_fim || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getOcorrencia(id) {
  const response = await api.get(`/ocorrencias/${id}/`);
  return response.data;
}

export async function createOcorrencia(data) {
  const response = await api.post('/ocorrencias/', data);
  return response.data;
}

export async function updateOcorrencia(id, data) {
  const response = await api.put(`/ocorrencias/${id}/`, data);
  return response.data;
}

export async function deleteOcorrencia(id) {
  await api.delete(`/ocorrencias/${id}/`);
}

export async function listOcorrenciaAlunoOptions() {
  const response = await api.get('/ocorrencias/alunos/');
  return response.data || [];
}

export async function listOcorrenciaTipoOptions() {
  const response = await api.get('/ocorrencias/tipos/');
  return response.data || [];
}

export async function listOcorrenciaProfessorOptions() {
  const response = await api.get('/ocorrencias/professores/');
  return response.data || [];
}
