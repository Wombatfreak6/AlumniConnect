import api from './api';

/**
 * Authentication API Service
 * Interacts with /api/auth endpoints using secure HttpOnly cookie sessions.
 */
export const authService = {
  /**
   * Register a new user (Student or Alumni)
   * @param {{ name: string, email: string, password: string, role: 'STUDENT' | 'ALUMNI' }} payload
   * @returns {Promise<{ success: boolean, message: string, data: { user: Object } }>}
   */
  async register({ name, email, password, role }) {
    return api.post('/auth/register', {
      name,
      email,
      password,
      role,
    });
  },

  /**
   * Log in user with email and password
   * @param {{ email: string, password: string }} payload
   * @returns {Promise<{ success: boolean, message: string, data: { user: Object } }>}
   */
  async login({ email, password }) {
    return api.post('/auth/login', {
      email,
      password,
    });
  },

  /**
   * Log out user and clear HttpOnly cookie session
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async logout() {
    return api.post('/auth/logout');
  },

  /**
   * Retrieve current authenticated user session
   * @returns {Promise<{ success: boolean, data: { user: Object } }>}
   */
  async getCurrentUser() {
    return api.get('/auth/me');
  },
};

export default authService;
