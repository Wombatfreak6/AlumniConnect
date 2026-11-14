import api from './api';

export const userService = {
  async getMyProfile() {
    return api.get('/users/me');
  },

  async updateMyProfile(payload) {
    return api.put('/users/me', payload);
  },

  async getUserById(id) {
    return api.get(`/users/${id}`);
  },

  // Accepts either a skill name or an existing skill id.
  async addSkill(skill) {
    const payload = typeof skill === 'number' ? { skillId: skill } : { name: skill };
    return api.post('/users/me/skills', payload);
  },

  async removeSkill(skillId) {
    return api.delete(`/users/me/skills/${skillId}`);
  },

  async getAllSkills(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return api.get(`/skills${query}`);
  },
};

export default userService;
