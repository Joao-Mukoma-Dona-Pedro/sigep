import api from './api';

export async function getDashboardSummary() {
  const response = await api.get('/dashboard/resumo/');
  return response.data;
}
