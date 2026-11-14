import React, { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { AuthContext } from './authContextInstance';

export { AuthContext };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initializeAuth = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      setUser(response?.data?.user || null);
    } catch {
      // Guests get a 401 here, so treat it as "not logged in".
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    authService
      .getCurrentUser()
      .then((response) => {
        if (isMounted) setUser(response?.data?.user || null);
      })
      .catch(() => {
        // Guests get a 401 here, so treat it as "not logged in".
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    setError(null);
    try {
      const response = await authService.login(credentials);
      const authenticatedUser = response.data?.user;
      setUser(authenticatedUser);
      return authenticatedUser;
    } catch (err) {
      setError(err.message || 'Login failed.');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await authService.register(userData);
      const newUser = response.data?.user;
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err.message || 'Registration failed.');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API warning:', err.message);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser: initializeAuth,
    isAuthenticated: Boolean(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
