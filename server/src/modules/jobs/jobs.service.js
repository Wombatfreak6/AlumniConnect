const { prisma } = require('../../config/database');

// Poster details shown with a job; passwordHash is never selected.
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

// Referrals are removed automatically via onDelete: Cascade in the Prisma schema.
async function deleteJob(jobId) {
  await prisma.jobPost.delete({ where: { id: jobId } });
}

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

