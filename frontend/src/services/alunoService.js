import api from './api';

export async function listAlunos({ search, turma, classe, estado, ordering, page = 1 } = {}) {
  const response = await api.get('/alunos/', {
    params: {
      search: search || undefined,
      turma: turma || undefined,
      classe: classe || undefined,
      estado: estado || undefined,
      ordering: ordering || undefined,
      page,
    },
  });

  return response.data;
}

export async function getAluno(id) {
  const response = await api.get(`/alunos/${id}/`);
  return response.data;
}

export async function createAluno(data) {
  const response = await api.post('/alunos/', data);
  return response.data;
}

export async function updateAluno(id, data) {
  const response = await api.put(`/alunos/${id}/`, data);
  return response.data;
}

export async function deleteAluno(id) {
  await api.delete(`/alunos/${id}/`);
}

export async function listTurmaOptions() {
  const response = await api.get('/turmas/', {
    params: {
      estado: 'ATIVO',
      ordering: 'classe',
      page_size: 100,
    },
  });

  return response.data.results || [];
}

export async function previewAlunoImport({ ficheiro, turma, modo }) {
  const formData = new FormData();
  formData.append('ficheiro', ficheiro);
  formData.append('turma', turma);
  formData.append('modo', modo);
  const response = await api.post('/alunos/importar/preview/', formData);
  return response.data;
}

export async function confirmAlunoImport({ ficheiro, turma, modo }) {
  const formData = new FormData();
  formData.append('ficheiro', ficheiro);
  formData.append('turma', turma);
  formData.append('modo', modo);
  const response = await api.post('/alunos/importar/confirmar/', formData);
  return response.data;
}

async function downloadFile(url, filename, params) {
  const response = await api.get(url, { params, responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function downloadAlunoTemplate() {
  return downloadFile('/alunos/importar/modelo/', 'modelo_alunos.csv');
}

export function exportAlunos(filters) {
  return downloadFile('/alunos/exportar/', 'alunos.csv', filters);
}
