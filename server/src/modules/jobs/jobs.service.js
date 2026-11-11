const { prisma } = require('../../config/database');

/**
 * Reusable Prisma select for the alumni poster embedded in job responses.
 * Never exposes passwordHash or isActive internals.
 */
const POSTER_SELECT = {
  id: true,
  name: true,
  profile: {
    select: {
      company: true,
      designation: true,
      industry: true,
      college: true,
      branch: true,
      graduationYear: true,
      linkedinUrl: true,
    },
  },
};

/**
 * Creates a new job post.
 * postedById is always taken from the authenticated user — never from the request body.
 */
async function createJob(alumniId, jobData) {
  const job = await prisma.jobPost.create({
    data: {
      ...jobData,
      postedById: alumniId,
    },
    include: {
      postedBy: { select: POSTER_SELECT },
    },
  });

  return job;
}

/**
 * Returns a paginated, filtered list of job posts.
 * Supports full-text search across title, description, and company.
 */
async function listJobs({ page, limit, filters }) {
  const where = buildJobWhereClause(filters);

  const [total, jobs] = await Promise.all([
    prisma.jobPost.count({ where }),
    prisma.jobPost.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        postedBy: { select: POSTER_SELECT },
        _count: { select: { referrals: true } },
      },
    }),
  ]);

  return {
    jobs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Returns a single job post with full poster details.
 * Throws 404 if the job does not exist.
 */
async function getJobById(jobId) {
  const job = await prisma.jobPost.findUnique({
    where: { id: jobId },
    include: {
      postedBy: { select: POSTER_SELECT },
      _count: { select: { referrals: true } },
    },
  });

  if (!job) {
    const err = new Error('Job post not found.');
    err.statusCode = 404;
    throw err;
  }

  return job;
}

/**
 * Updates a job post.
 * Ownership is enforced in the controller before calling this function.
 */
async function updateJob(jobId, updateData) {
  const updated = await prisma.jobPost.update({
    where: { id: jobId },
    data: updateData,
    include: {
      postedBy: { select: POSTER_SELECT },
    },
  });

  return updated;
}

/**
 * Deletes a job post and cascades to its referrals (onDelete: Cascade on JobReferral).
 * Ownership is enforced in the controller before calling this function.
 */
async function deleteJob(jobId) {
  await prisma.jobPost.delete({ where: { id: jobId } });
}

/**
 * Returns all jobs posted by a specific alumni, with per-job referral counts
 * broken down by status for the management dashboard.
 */
async function getMyJobs(alumniId) {
  const jobs = await prisma.jobPost.findMany({
    where: { postedById: alumniId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { referrals: true } },
      referrals: {
        select: { status: true },
      },
    },
  });

  // Enrich each job with a status breakdown summary
  return jobs.map((job) => {
    const statusCounts = { PENDING: 0, REVIEWED: 0, ACCEPTED: 0, REJECTED: 0 };
    for (const ref of job.referrals) {
      if (statusCounts[ref.status] !== undefined) {
        statusCounts[ref.status] += 1;
      }
    }

    const { referrals: _, ...jobWithoutRaw } = job;
    return {
      ...jobWithoutRaw,
      referralSummary: statusCounts,
    };
  });
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Builds a Prisma `where` clause from validated filter parameters.
 */
function buildJobWhereClause({ search, company, location, skill, employmentType, experienceLevel } = {}) {
  const where = {};

  if (employmentType) {
    where.employmentType = employmentType;
  }

  if (experienceLevel) {
    where.experienceLevel = experienceLevel;
  }

  if (company) {
    where.company = { contains: company, mode: 'insensitive' };
  }

  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }

  if (search) {
    // Full-text search across title, description, and company name
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { company: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (skill) {
    const skillMatch = {
      OR: [
        { title: { contains: skill, mode: 'insensitive' } },
        { description: { contains: skill, mode: 'insensitive' } },
      ],
    };
    where.AND = [...(where.AND || []), skillMatch];
  }

  return where;
}

module.exports = {
  createJob,
  listJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
};

