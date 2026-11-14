import api from './api';

// Skips empty filters so we don't send ?search=&page=1 style queries.
function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export const jobService = {
  // Jobs
  async getJobs(params = {}) {
    return api.get(`/jobs${buildQueryString(params)}`);
  },

  async getJobById(id) {
    return api.get(`/jobs/${id}`);
  },

  async createJob(jobData) {
    return api.post('/jobs', jobData);
  },

  async updateJob(id, jobData) {
    return api.put(`/jobs/${id}`, jobData);
  },

  async deleteJob(id) {
    return api.delete(`/jobs/${id}`);
  },

  async getMyJobs() {
    return api.get('/jobs/my');
  },

  // Referrals
  async requestReferral(jobId, data = {}) {
    return api.post(`/jobs/${jobId}/referrals`, data);
  },

  async getAlumniReferrals(params = {}) {
    return api.get(`/alumni/referrals${buildQueryString(params)}`);
  },

  async getStudentReferrals() {
    return api.get('/student/referrals');
  },

  // Allowed: PENDING -> REVIEWED/ACCEPTED/REJECTED, REVIEWED -> ACCEPTED/REJECTED.
  async updateReferralStatus(id, status) {
    return api.patch(`/referrals/${id}/status`, { status });
  },

  // Recommendations
  async getRecommendedJobs(params = {}) {
    return api.get(`/jobs/recommendations${buildQueryString(params)}`);
  },

  async getRecommendedAlumni(params = {}) {
    return api.get(`/network/matches${buildQueryString(params)}`);
  },
};

export default jobService;
