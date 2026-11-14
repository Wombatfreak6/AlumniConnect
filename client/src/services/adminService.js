import api from './api';

export const adminService = {
  async getStats() {
    return api.get('/admin/stats');
  },

  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.role) query.append('role', params.role);
    // The backend reads status=active/inactive, not a boolean isActive param.
    if (params.isActive !== undefined && params.isActive !== null && params.isActive !== '') {
      query.append('status', params.isActive ? 'active' : 'inactive');
    }
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/admin/users${queryString}`);
  },

  async getUserById(id) {
    return api.get(`/admin/users/${id}`);
  },

  async updateUserStatus(id, isActive) {
    return api.patch(`/admin/users/${id}/status`, { isActive });
  },
};

export default adminService;
