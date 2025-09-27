import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as apiLogin, verify as apiVerify } from '../services/api';

type User = { id: number; name: string; email: string } | null;

type AuthContextValue = {
  user: User;
  token: string | null;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    (async () => {
      try {
        if (token) {
          const { user } = await apiVerify();
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        }
      } catch (_) {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    })();
  }, []);

  const login = async (email: string, password: string, remember: boolean = true) => {
    const { token, user } = await apiLogin(email, password);
    setToken(token);
    setUser(user);
    if (remember) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (!user) {
    return <div style={{ padding: 24 }}><h2>Unauthorized</h2><p>Please login to access this page.</p></div>;
  }
  return children;
}


