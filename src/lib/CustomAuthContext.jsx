import React, { createContext, useState, useContext, useEffect } from 'react';
import { loadSession, clearSession, saveSession } from '@/lib/customAuth';

const CustomAuthContext = createContext();

export const CustomAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (session?.user) {
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    if (token) saveSession(userData, token);
    setUser(userData);
  };

  const logout = () => {
    clearSession();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <CustomAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </CustomAuthContext.Provider>
  );
};

export const useCustomAuth = () => {
  const ctx = useContext(CustomAuthContext);
  if (!ctx) throw new Error('useCustomAuth must be used within CustomAuthProvider');
  return ctx;
};