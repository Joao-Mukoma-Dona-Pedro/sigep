import api from './api';

const reportEndpoints = {
  geral: '/relatorios/geral/',
  professores: '/relatorios/professores/',
  disciplinas: '/relatorios/disciplinas/',
  lecionacoes: '/relatorios/lecionacoes/',
  turmas: '/relatorios/turmas/',
  alunos: '/relatorios/alunos/',
  planificacoes: '/relatorios/planificacoes/',
  controloAulas: '/relatorios/controlo-aulas/',
  pct: '/relatorios/pct/',
  anoLectivo: '/relatorios/desempenho-pct/',
  desempenhoPCT: '/relatorios/desempenho-pct/',
  ocorrencias: '/relatorios/ocorrencias/',
  reunioes: '/relatorios/reunioes/',
};

export async function listRelatorioOptions() {
  const response = await api.get('/relatorios/opcoes/');
  return response.data;
}

export async function getRelatorio(type, params = {}) {
  const endpoint = reportEndpoints[type];
  if (!endpoint) throw new Error('Tipo de relatório inválido.');
  const response = await api.get(endpoint, { params });
  return response.data;
}
