import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  clearSessionStorage,
  getProfile,
  getStoredSession,
  login as loginRequest,
  logout as logoutRequest,
  saveSession,
} from '../services/authService';

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = 'sigep.access';
const REFRESH_TOKEN_KEY = 'sigep.refresh';

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(REFRESH_TOKEN_KEY));
  const [user, setUser] = useState(() => getStoredSession().user);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearSession = useCallback(() => {
    clearSessionStorage();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email, password) => {
    const session = await loginRequest(email, password);

    saveSession(session);
    setAccessToken(session.access);
    setRefreshToken(session.refresh);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest(refreshToken);
    } catch {
      // A sessao local deve ser encerrada mesmo que o token ja esteja expirado.
    }
    clearSession();
  }, [clearSession, refreshToken]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapSession() {
      if (!accessToken) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const profile = await getProfile();
        if (isMounted) {
          setUser(profile);
          localStorage.setItem('sigep.user', JSON.stringify(profile));
        }
      } catch {
        if (isMounted) {
          clearSession();
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrapSession();

    return () => {
      isMounted = false;
    };
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
