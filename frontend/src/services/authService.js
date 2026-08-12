import api from './api';

const ACCESS_TOKEN_KEY = 'sigep.access';
const REFRESH_TOKEN_KEY = 'sigep.refresh';
const USER_KEY = 'sigep.user';

export function saveSession({ access, refresh, user }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSessionStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredSession() {
  const access = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);
  const userValue = localStorage.getItem(USER_KEY);

  return {
    access,
    refresh,
    user: userValue ? JSON.parse(userValue) : null,
  };
}

export async function login(email, password) {
  const response = await api.post('/auth/login/', { email, password });
  return response.data;
}

export async function logout(refresh) {
  if (!refresh) return;
  await api.post('/auth/logout/', { refresh });
}

export async function getProfile() {
  const response = await api.get('/auth/me/');
  return response.data;
}
