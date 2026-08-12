import api from './api';

export async function listControlosAulas({
  search,
  professor,
  disciplina,
  turma,
  ano_lectivo,
  data,
  aula_assistida,
  ordering,
  page = 1,
} = {}) {
  const response = await api.get('/controlo-aulas/', {
    params: {
      search: search || undefined,
      professor: professor || undefined,
      disciplina: disciplina || undefined,
      turma: turma || undefined,
      ano_lectivo: ano_lectivo || undefined,
      data: data || undefined,
      aula_assistida: aula_assistida || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getControloAula(id) {
  const response = await api.get(`/controlo-aulas/${id}/`);
  return response.data;
}

export async function createControloAula(data) {
  const response = await api.post('/controlo-aulas/', data);
  return response.data;
}

export async function updateControloAula(id, data) {
  const response = await api.put(`/controlo-aulas/${id}/`, data);
  return response.data;
}

export async function deleteControloAula(id) {
  await api.delete(`/controlo-aulas/${id}/`);
}

export async function listLecionacaoOptions() {
  const response = await api.get('/controlo-aulas/lecionacoes/');
  return response.data || [];
}
