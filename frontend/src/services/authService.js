import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },

  logout: async (refresh) => {
    if (!refresh) return;
    await api.post('/auth/logout/', { refresh });
  },

  getProfile: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/password-reset/', { email });
    return response.data;
  },
};
