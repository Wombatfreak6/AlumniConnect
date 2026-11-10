const jobsService = require('./jobs.service');
const { validateJobPost, validateJobListQuery, validateIntegerId } = require('./jobs.validation');

// ============================================================================
// POST /api/jobs
// ============================================================================

/**
 * Creates a new job post.
 * Restricted to ALUMNI. postedById is always sourced from req.user.id.
 */
async function createJob(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateJobPost(req.body, true);
    if (!isValid) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const currentUserId = req.user.userId || req.user.id;
    const job = await jobsService.createJob(currentUserId, sanitized);

    return res.status(201).json({
      success: true,
      message: 'Job post created successfully.',
      data: { job },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================================
// GET /api/jobs/my  ← must be registered BEFORE /:id to avoid "my" → parseInt
// ============================================================================

/**
 * Returns all jobs posted by the authenticated alumni with per-job referral summaries.
 * Restricted to ALUMNI.
 */
async function getMyJobs(req, res, next) {
  try {
    const currentUserId = req.user.userId || req.user.id;
    const jobs = await jobsService.getMyJobs(currentUserId);

    return res.status(200).json({
      success: true,
      message: 'Your job postings retrieved successfully.',
      data: { jobs },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================================
// GET /api/jobs
// ============================================================================

/**
 * Returns a paginated, filtered list of all job posts.
 * Accessible to any authenticated user (STUDENT, ALUMNI, ADMIN).
 */
async function listJobs(req, res, next) {
  try {
    const { page, limit, filters } = validateJobListQuery(req.query);
    const result = await jobsService.listJobs({ page, limit, filters });

    return res.status(200).json({
      success: true,
      message: 'Job posts retrieved successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================================
// GET /api/jobs/:id
// ============================================================================

/**
 * Returns the full details of a single job post including alumni poster info.
 * Accessible to any authenticated user.
 */
async function getJobById(req, res, next) {
  try {
    const { isValid, error, id } = validateIntegerId(req.params.id, 'jobId');
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    const job = await jobsService.getJobById(id);

    return res.status(200).json({
      success: true,
      message: 'Job post retrieved successfully.',
      data: { job },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================================
// PUT /api/jobs/:id
// ============================================================================

/**
 * Updates an existing job post.
 * Only the original poster (ALUMNI) or an ADMIN may update.
 * Partial updates are supported — only provided fields are changed.
 */
async function updateJob(req, res, next) {
  try {
    const { isValid: idValid, error: idError, id } = validateIntegerId(req.params.id, 'jobId');
    if (!idValid) {
      return res.status(400).json({ success: false, message: idError });
    }

    // Fetch current record to verify existence and ownership
    const existing = await jobsService.getJobById(id);

    const currentUserId = req.user.userId || req.user.id;
    if (existing.postedById !== currentUserId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only the original poster or an administrator can update this job.',
      });
    }

    // Validate only the fields that were actually sent (requireAll = false)
    const { isValid, errors, sanitized } = validateJobPost(req.body, false);
    if (!isValid) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    if (Object.keys(sanitized).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided to update.',
      });
    }

    const updated = await jobsService.updateJob(id, sanitized);

    return res.status(200).json({
      success: true,
      message: 'Job post updated successfully.',
      data: { job: updated },
    });
  } catch (err) {
    next(err);
  }
}

// ============================================================================
// DELETE /api/jobs/:id
// ============================================================================

/**
 * Deletes a job post and cascades to its referrals.
 * Only the original poster (ALUMNI) or an ADMIN may delete.
 */
async function deleteJob(req, res, next) {
  try {
    const { isValid, error, id } = validateIntegerId(req.params.id, 'jobId');
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    // Fetch to verify existence and ownership before destructive operation
    const existing = await jobsService.getJobById(id);

    const currentUserId = req.user.userId || req.user.id;
    if (existing.postedById !== currentUserId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only the original poster or an administrator can delete this job.',
      });
    }

    await jobsService.deleteJob(id);

    return res.status(200).json({
      success: true,
      message: 'Job post deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createJob,
  getMyJobs,
  listJobs,
  getJobById,
  updateJob,
  deleteJob,
};

