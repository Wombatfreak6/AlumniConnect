import api from './api';

/**
 * Administrative Oversight API Service
 * Interacts with /api/admin endpoints (strictly restricted to ADMIN role).
 */
export const adminService = {
  /**
   * Fetch paginated and filtered users list
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   role?: 'STUDENT' | 'ALUMNI' | 'ADMIN',
   *   isActive?: boolean,
   *   search?: string
   * }} [params={}]
   * @returns {Promise<{ success: boolean, data: { users: Array, pagination: Object } }>}
   */
  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.role) query.append('role', params.role);
    if (params.isActive !== undefined && params.isActive !== null && params.isActive !== '') {
      query.append('isActive', params.isActive);
    }
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return api.get(`/admin/users${queryString}`);
  },

  /**
   * Fetch complete user details including administrative relations
   * @param {number|string} id
   * @returns {Promise<{ success: boolean, data: { user: Object } }>}
   */
  async getUserById(id) {
    return api.get(`/admin/users/${id}`);
  },

  /**
   * Activate or deactivate a user account
   * @param {number|string} id
   * @param {boolean} isActive
   * @returns {Promise<{ success: boolean, message: string, data: { user: Object } }>}
   */
  async updateUserStatus(id, isActive) {
    return api.patch(`/admin/users/${id}/status`, { isActive });
  },
};

export default adminService;
