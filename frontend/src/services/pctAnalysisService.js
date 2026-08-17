import api from './api';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

export async function getIndividualAnalysis(params) {
  const response = await api.get('/pct-analises/individual/', { params: cleanParams(params) });
  return response.data;
}

export async function getTurmaAnalysis(params) {
  const response = await api.get('/pct-analises/turma/', { params: cleanParams(params) });
  return response.data;
}

export async function getClasseAnalysis(params) {
  const response = await api.get('/pct-analises/classe/', { params: cleanParams(params) });
  return response.data;
}

export async function getAnoLectivoAnalysis(params) {
  const response = await api.get('/pct-analises/ano-lectivo/', { params: cleanParams(params) });
  return response.data;
}

export async function listAnalysisLecionacoes() {
  const response = await api.get('/pct/lecionacoes/');
  return response.data || [];
}

export async function listAnalysisPCT() {
  const response = await api.get('/pct/', { params: { page_size: 100, ordering: '-data_aplicacao' } });
  return response.data.results || [];
}

export async function listAnalysisAlunos() {
  const response = await api.get('/alunos/', { params: { page_size: 100, ordering: 'nome' } });
  return response.data.results || [];
}
