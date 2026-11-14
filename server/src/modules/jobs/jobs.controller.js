const jobsService = require('./jobs.service');
const { validateJobPost, validateJobListQuery, validateIntegerId } = require('./jobs.validation');

// A job can be managed by the alumnus who posted it or by an admin.
function canManageJob(job, user) {
  return job.postedById === user.id || user.role === 'ADMIN';
}

async function createJob(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateJobPost(req.body, true);
    if (!isValid) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    // Poster id hamesha token se aata hai, request body se nahi.
    const job = await jobsService.createJob(req.user.id, sanitized);

    return res.status(201).json({
      success: true,
      message: 'Job post created successfully.',
      data: { job },
    });
  } catch (err) {
    next(err);
  }
}

async function getMyJobs(req, res, next) {
  try {
    const jobs = await jobsService.getMyJobs(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'Your job postings retrieved successfully.',
      data: { jobs },
    });
  } catch (err) {
    next(err);
  }
}

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

async function updateJob(req, res, next) {
  try {
    const { isValid: idValid, error: idError, id } = validateIntegerId(req.params.id, 'jobId');
    if (!idValid) {
      return res.status(400).json({ success: false, message: idError });
    }

    const existing = await jobsService.getJobById(id);
    if (!canManageJob(existing, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: only the original poster or an administrator can update this job.',
      });
    }

    // requireAll = false so partial updates only validate the fields that were sent.
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

async function deleteJob(req, res, next) {
  try {
    const { isValid, error, id } = validateIntegerId(req.params.id, 'jobId');
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    const existing = await jobsService.getJobById(id);
    if (!canManageJob(existing, req.user)) {
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
