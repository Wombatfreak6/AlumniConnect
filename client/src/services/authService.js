import api from './api';

export const authService = {
  async register({ name, email, password, role }) {
    return api.post('/auth/register', { name, email, password, role });
  },

  async login({ email, password }) {
    return api.post('/auth/login', { email, password });
  },

  async logout() {
    return api.post('/auth/logout');
  },

  async getCurrentUser() {
    return api.get('/auth/me');
  },
};

export default authService;
