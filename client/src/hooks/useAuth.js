import { useContext } from 'react';
import { AuthContext } from '../context/authContextInstance';

/**
 * Custom hook to access authentication context
 * @returns {{
 *   user: Object | null,
 *   loading: boolean,
 *   error: string | null,
 *   isAuthenticated: boolean,
 *   login: (credentials: { email: string, password: string }) => Promise<Object>,
 *   register: (userData: { name: string, email: string, password: string, role: string }) => Promise<Object>,
 *   logout: () => Promise<void>,
 *   refreshUser: () => Promise<void>
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
