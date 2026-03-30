'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // start true, resolve after token check

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  useEffect(() => {
    // On mount: check if a valid token exists by calling a protected endpoint
    const initAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      // Set the token header first
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      try {
        // Validate the token is still good by fetching documents
        // (any protected endpoint works — we just need a 200 vs 401)
        await api.get('/documents/', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Token is valid — decode email from JWT payload
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setUser({ id: payload.sub || 'user', email: payload.sub || '' });
        } catch {
          // Can't decode payload — still mark as logged in with fallback
          setUser({ id: 'user', email: '' });
        }
      } catch (err: unknown) {
        // 401 = token expired or invalid — clear it
        if (
          axios.isAxiosError(err) &&
          err.response?.status === 401
        ) {
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
        } else {
          // Network error or other — keep token, assume valid
          // (prevents logout on backend restart / offline)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({ id: payload.sub || 'user', email: payload.sub || '' });
          } catch {
            setUser({ id: 'user', email: '' });
          }
        }
      } finally {
        setLoading(false);
      }
    };

    // Axios request interceptor — always inject latest token
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const localToken = localStorage.getItem('token');
        if (localToken && config.headers) {
          config.headers.Authorization = `Bearer ${localToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Axios response interceptor — auto-logout on 401
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only auto-logout if we're not in the middle of initAuth
          if (localStorage.getItem('token')) {
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    initAuth();

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post(
        '/auth/token',
        new URLSearchParams({ username: email, password })
      );
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      try {
        const payload = JSON.parse(atob(access_token.split('.')[1]));
        setUser({ id: payload.sub || 'user', email: payload.sub || email });
      } catch {
        setUser({ id: 'user', email });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Login failed');
      }
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      await api.post('/auth/register', { email, password });
      await login(email, password);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || 'Registration failed');
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
