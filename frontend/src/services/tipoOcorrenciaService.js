import api from './api';

export async function listTiposOcorrencia({ search, categoria, ordering, page = 1 } = {}) {
  const response = await api.get('/tipos-ocorrencia/', {
    params: {
      search: search || undefined,
      categoria: categoria || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getTipoOcorrencia(id) {
  const response = await api.get(`/tipos-ocorrencia/${id}/`);
  return response.data;
}

export async function createTipoOcorrencia(data) {
  const response = await api.post('/tipos-ocorrencia/', data);
  return response.data;
}

export async function updateTipoOcorrencia(id, data) {
  const response = await api.put(`/tipos-ocorrencia/${id}/`, data);
  return response.data;
}

export async function deleteTipoOcorrencia(id) {
  await api.delete(`/tipos-ocorrencia/${id}/`);
}
