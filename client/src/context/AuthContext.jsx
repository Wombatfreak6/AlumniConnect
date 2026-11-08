import React, { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { AuthContext } from './authContextInstance';

export { AuthContext };

/**
 * Central Authentication Provider
 * Manages user state, initial session restoration via GET /api/auth/me,
 * login, registration, and logout.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Restore existing authenticated session on app initialization
   */
  const initializeAuth = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response && response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch {
      // 401 / Not authenticated or connection error on initial load is expected for guests
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    authService
      .getCurrentUser()
      .then((response) => {
        if (isMounted) {
          if (response && response.data && response.data.user) {
            setUser(response.data.user);
          } else {
            setUser(null);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user with credentials and update state
   */
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

  /**
   * Register new user (Student or Alumni) and establish authenticated session
   */
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

  /**
   * Terminate authenticated session and clear HttpOnly cookie
   */
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
