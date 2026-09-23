import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore, setUnauthorizedHandler } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) { setReady(true); return; }
    api.me()
      .then((d) => setUser(d.user))
      .catch(() => tokenStore.clear())
      .finally(() => setReady(true));
  }, [logout]);

  const login = async (login, password) => {
    const d = await api.login(login, password);
    tokenStore.set(d.token);
    setUser(d.user);
    return d.user;
  };

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
