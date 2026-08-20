import api from './api';

export async function askAssistant({ message, route, pageContext, filters = {} }) {
  const response = await api.post('/assistant/chat/', {
    message,
    route,
    page_context: pageContext,
    filters,
  });

  return response.data;
}

export default {
  askAssistant,
};

