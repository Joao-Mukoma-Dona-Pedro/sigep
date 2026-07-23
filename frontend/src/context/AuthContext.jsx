import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { authService } from '../services/authService';

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = 'sigep.access';
const REFRESH_TOKEN_KEY = 'sigep.refresh';
const USER_KEY = 'sigep.user';

function readStoredUser() {
  const value = localStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
}

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(REFRESH_TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(accessToken));

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setAccessToken(data.access);
    setRefreshToken(data.refresh);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout(refreshToken);
    } finally {
      clearSession();
    }
  }, [clearSession, refreshToken]);

  useEffect(() => {
    if (!accessToken) {
      setIsBootstrapping(false);
      return;
    }

    authService
      .getProfile()
      .then((profile) => {
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
        setUser(profile);
      })
      .catch(clearSession)
      .finally(() => setIsBootstrapping(false));
  }, [accessToken, clearSession]);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: Boolean(accessToken),
      isBootstrapping,
      login,
      logout,
      clearSession,
    }),
    [accessToken, clearSession, isBootstrapping, login, logout, refreshToken, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return context;
}
