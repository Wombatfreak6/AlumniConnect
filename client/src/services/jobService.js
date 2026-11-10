import api from './api';

/**
 * Builds a clean query string from an object of parameters,
 * filtering out undefined, null, or empty string values.
 *
 * @param {Record<string, any>} [params={}]
 * @returns {string} e.g. "?search=developer&page=1" or ""
 */
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

/**
 * Job Management, Referral Engine & Matching API Service
 * Interacts with /api/jobs, /api/referrals, and /api/network endpoints.
 */
export const jobService = {
  // ==========================================================================
  // 1. JOB MANAGEMENT
  // ==========================================================================

  /**
   * Browse paginated and filtered job postings.
   * Accessible to any authenticated user (STUDENT, ALUMNI, ADMIN).
   *
   * @param {{
   *   search?: string,
   *   company?: string,
   *   employmentType?: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT' | 'REMOTE',
   *   experienceLevel?: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD',
   *   page?: number,
   *   limit?: number
   * }} [params={}]
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: {
   *     jobs: Array<Object>,
   *     pagination: { total: number, page: number, limit: number, totalPages: number }
   *   }
   * }>}
   */
  async getJobs(params = {}) {
    const queryString = buildQueryString(params);
    return api.get(`/jobs${queryString}`);
  },

  /**
   * Retrieve a single job post with full poster information.
   *
   * @param {number|string} id Job ID
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: { job: Object }
   * }>}
   */
  async getJobById(id) {
    return api.get(`/jobs/${id}`);
  },

  /**
   * Create a new job post.
   * Restricted to ALUMNI. postedById is automatically set on backend from session.
   *
   * @param {{
   *   title: string,
   *   description: string,
   *   company: string,
   *   location: string,
   *   employmentType: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT' | 'REMOTE',
   *   experienceLevel: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD',
   *   applicationUrl?: string,
   *   deadline?: string
   * }} jobData
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: { job: Object }
   * }>}
   */
  async createJob(jobData) {
    return api.post('/jobs', jobData);
  },

  /**
   * Update an existing job post.
   * Restricted to original alumni poster or ADMIN.
   *
   * @param {number|string} id Job ID
   * @param {Partial<{
   *   title: string,
   *   description: string,
   *   company: string,
   *   location: string,
   *   employmentType: string,
   *   experienceLevel: string,
   *   applicationUrl: string,
   *   deadline: string
   * }>} jobData
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: { job: Object }
   * }>}
   */
  async updateJob(id, jobData) {
    return api.put(`/jobs/${id}`, jobData);
  },

  /**
   * Delete a job post and cascade associated referral records.
   * Restricted to original alumni poster or ADMIN.
   *
   * @param {number|string} id Job ID
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async deleteJob(id) {
    return api.delete(`/jobs/${id}`);
  },

  /**
   * Retrieve all jobs posted by the currently authenticated alumnus,
   * enriched with referralSummary breakdown by status.
   * Restricted to ALUMNI.
   *
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: { jobs: Array<Object> }
   * }>}
   */
  async getMyJobs() {
    return api.get('/jobs/my');
  },

  // ==========================================================================
  // 2. REFERRALS ENGINE
  // ==========================================================================

  /**
   * Submit a referral request for a specific job post.
   * Restricted to STUDENT. Prevents duplicate submissions with HTTP 409.
   *
   * @param {number|string} jobId
   * @param {{ message?: string }} [data={}]
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: { referral: Object }
   * }>}
   */
  async requestReferral(jobId, data = {}) {
    return api.post(`/jobs/${jobId}/referrals`, data);
  },

  /**
   * Retrieve incoming referral requests for jobs posted by the authenticated alumnus.
   * Restricted to ALUMNI.
   *
   * @param {{
   *   status?: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
   * }} [params={}]
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: { referrals: Array<Object> }
   * }>}
   */
  async getAlumniReferrals(params = {}) {
    const queryString = buildQueryString(params);
    return api.get(`/alumni/referrals${queryString}`);
  },

  /**
   * Retrieve outgoing referral requests submitted by the authenticated student.
   * Restricted to STUDENT.
   *
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: { referrals: Array<Object> }
   * }>}
   */
  async getStudentReferrals() {
    return api.get('/student/referrals');
  },

  /**
   * Update the status of a referral request.
   * Restricted to the assigned ALUMNI reviewer.
   * Allowed transitions: PENDING -> REVIEWED/ACCEPTED/REJECTED, REVIEWED -> ACCEPTED/REJECTED.
   *
   * @param {number|string} id Referral ID
   * @param {'REVIEWED' | 'ACCEPTED' | 'REJECTED'} status
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: { referral: Object }
   * }>}
   */
  async updateReferralStatus(id, status) {
    return api.patch(`/referrals/${id}/status`, { status });
  },

  // ==========================================================================
  // 3. RECOMMENDATIONS & MATCHING
  // ==========================================================================

  /**
   * Retrieve personalized job recommendations sorted by descending match score.
   * Evaluated across Skill Overlap (50%), Academic Branch (30%), and Industry Interest (20%).
   * Restricted to STUDENT.
   *
   * @param {{
   *   limit?: number,
   *   minScore?: number
   * }} [params={}]
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: Array<{
   *     jobId: number,
   *     title: string,
   *     company: string,
   *     matchScore: number,
   *     matchedSkills: Array<string>,
   *     reason: string,
   *     breakdown: { skillScore: number, branchScore: number, industryScore: number }
   *   }>
   * }>}
   */
  async getRecommendedJobs(params = {}) {
    const queryString = buildQueryString(params);
    return api.get(`/jobs/recommendations${queryString}`);
  },

  /**
   * Retrieve recommended alumni network connections sorted by descending match score.
   * Self-exclusion is guaranteed on backend.
   * Restricted to STUDENT.
   *
   * @param {{
   *   limit?: number,
   *   minScore?: number
   * }} [params={}]
   * @returns {Promise<{
   *   success: boolean,
   *   message: string,
   *   data: Array<{
   *     alumniId: number,
   *     name: string,
   *     company: string,
   *     designation: string,
   *     branch: string,
   *     matchScore: number,
   *     matchedSkills: Array<string>,
   *     reason: string,
   *     breakdown: { skillScore: number, branchScore: number, industryScore: number }
   *   }>
   * }>}
   */
  async getRecommendedAlumni(params = {}) {
    const queryString = buildQueryString(params);
    return api.get(`/network/matches${queryString}`);
  },
};

export default jobService;
