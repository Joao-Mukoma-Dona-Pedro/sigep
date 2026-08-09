import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async (email) => {
    const demoUser = {
      id: 1,
      email,
      full_name: 'Subdiretor/Diretor Pedagogico',
      role: 'PEDAGOGICAL_DIRECTOR',
    };
    const demoAccess = 'sigep-demo-access-token';
    const demoRefresh = 'sigep-demo-refresh-token';

    localStorage.setItem(ACCESS_TOKEN_KEY, demoAccess);
    localStorage.setItem(REFRESH_TOKEN_KEY, demoRefresh);
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
    setAccessToken(demoAccess);
    setRefreshToken(demoRefresh);
    setUser(demoUser);
  }, []);

  const logout = useCallback(async () => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    setIsBootstrapping(false);
  }, []);

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
