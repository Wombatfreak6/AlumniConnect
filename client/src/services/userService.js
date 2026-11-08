import api from './api';

/**
 * User & Profile Management API Service
 * Interacts with /api/users and /api/skills endpoints.
 */
export const userService = {
  /**
   * Fetch current authenticated user's profile and skills
   * @returns {Promise<{ success: boolean, data: { user: Object } }>}
   */
  async getMyProfile() {
    return api.get('/users/me');
  },

  /**
   * Update current authenticated user's profile and optional display name
   * @param {{
   *   name?: string,
   *   college?: string,
   *   branch?: string,
   *   batch?: string,
   *   graduationYear?: number | string,
   *   bio?: string,
   *   company?: string,
   *   designation?: string,
   *   industry?: string,
   *   careerGoals?: string,
   *   linkedinUrl?: string
   * }} payload
   * @returns {Promise<{ success: boolean, data: { user: Object } }>}
   */
  async updateMyProfile(payload) {
    return api.put('/users/me', payload);
  },

  /**
   * Retrieve safe public profile for any user
   * @param {number|string} id
   * @returns {Promise<{ success: boolean, data: { user: Object } }>}
   */
  async getUserById(id) {
    return api.get(`/users/${id}`);
  },

  /**
   * Add a skill to the current user's profile
   * @param {string|number} skill Name of new skill or numeric skillId
   * @returns {Promise<{ success: boolean, data: { skill: Object } }>}
   */
  async addSkill(skill) {
    const payload = typeof skill === 'number' ? { skillId: skill } : { name: skill };
    return api.post('/users/me/skills', payload);
  },

  /**
   * Remove a skill from the current user's profile
   * @param {number} skillId
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async removeSkill(skillId) {
    return api.delete(`/users/me/skills/${skillId}`);
  },

  /**
   * Retrieve all canonical skills in catalog
   * @param {string} [search='']
   * @returns {Promise<{ success: boolean, data: { skills: Array } }>}
   */
  async getAllSkills(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get(`/skills${query}`);
  },
};

export default userService;
