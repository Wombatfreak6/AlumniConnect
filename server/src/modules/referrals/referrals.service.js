const { prisma } = require('../../config/database');
const { validateStatusTransition } = require('./referrals.validation');
const { notifySafely } = require('../notifications/notifications.service');

function formatStudentProfile(student) {
  if (!student) return null;
  const { userSkills, ...rest } = student;
  return {
    ...rest,
    skills: userSkills
      ? userSkills.map((us) => ({
          id: us.skill.id,
          name: us.skill.name,
        }))
      : [],
  };
}

async function createReferral({ studentId, jobPostId, message }) {
  const job = await prisma.jobPost.findUnique({
    where: { id: jobPostId },
    select: {
      id: true,
      title: true,
      postedById: true,
      company: true,
    },
  });

  if (!job) {
    const error = new Error('Job post not found.');
    error.statusCode = 404;
    throw error;
  }

  if (job.postedById === studentId) {
    const error = new Error('Cannot request a referral for your own job posting.');
    error.statusCode = 400;
    throw error;
  }

  // Ek student same job ke liye dobara referral nahi bhej sakta.
  const existingReferral = await prisma.jobReferral.findUnique({
    where: {
      studentId_jobPostId: {
        studentId,
        jobPostId,
      },
    },
  });

  if (existingReferral) {
    const error = new Error('You have already submitted a referral request for this job.');
    error.statusCode = 409;
    throw error;
  }

  const referral = await prisma.jobReferral.create({
    data: {
      studentId,
      alumniId: job.postedById,
      jobPostId,
      message,
      status: 'PENDING',
    },
    include: {
      jobPost: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          employmentType: true,
          experienceLevel: true,
        },
      },
      alumni: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              company: true,
              designation: true,
            },
          },
        },
      },
    },
  });

  await notifySafely({
    userId: referral.alumniId,
    type: 'REFERRAL_RECEIVED',
    title: 'New referral request',
    message: `A student requested a referral for “${job.title}”.`,
    href: '/referrals/received',
  });

  return referral;
}

async function getAlumniReferrals(alumniId, status = null) {
  const where = { alumniId };

  if (status) {
    where.status = status;
  }

  const referrals = await prisma.jobReferral.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              college: true,
              branch: true,
              batch: true,
              graduationYear: true,
              bio: true,
              careerGoals: true,
              linkedinUrl: true,
            },
          },
          userSkills: {
            select: {
              skill: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      jobPost: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          employmentType: true,
          experienceLevel: true,
          applicationUrl: true,
          deadline: true,
        },
      },
    },
  });

  return referrals.map((ref) => ({
    ...ref,
    student: formatStudentProfile(ref.student),
  }));
}

async function getStudentReferrals(studentId) {
  const referrals = await prisma.jobReferral.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      jobPost: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          employmentType: true,
          experienceLevel: true,
          applicationUrl: true,
          deadline: true,
        },
      },
      alumni: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: {
            select: {
              company: true,
              designation: true,
              industry: true,
              college: true,
              branch: true,
              linkedinUrl: true,
            },
          },
        },
      },
    },
  });

  return referrals;
}

async function getReferralById(referralId) {
  const referral = await prisma.jobReferral.findUnique({
    where: { id: referralId },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: true,
        },
      },
      alumni: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      jobPost: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
    },
  });

  if (!referral) {
    const error = new Error('Referral request not found.');
    error.statusCode = 404;
    throw error;
  }

  return referral;
}

async function updateReferralStatus(referralId, newStatus, currentUserId) {
  const referral = await prisma.jobReferral.findUnique({
    where: { id: referralId },
  });

  if (!referral) {
    const error = new Error('Referral request not found.');
    error.statusCode = 404;
    throw error;
  }

  if (referral.alumniId !== currentUserId) {
    const error = new Error('Forbidden: Only the assigned alumnus can update this referral request.');
    error.statusCode = 403;
    throw error;
  }

  const transitionCheck = validateStatusTransition(referral.status, newStatus);
  if (!transitionCheck.isValid) {
    const error = new Error(transitionCheck.error);
    error.statusCode = 400;
    throw error;
  }

  const updatedReferral = await prisma.jobReferral.update({
    where: { id: referralId },
    data: { status: newStatus },
    include: {
      jobPost: {
        select: {
          id: true,
          title: true,
          company: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      alumni: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  await notifySafely({
    userId: referral.studentId,
    type: 'REFERRAL_STATUS',
    title: 'Referral request updated',
    message: `Your referral request for “${updatedReferral.jobPost.title}” is now ${newStatus.toLowerCase()}.`,
    href: '/referrals/my',
  });

  return updatedReferral;
}

module.exports = {
  createReferral,
  getAlumniReferrals,
  getStudentReferrals,
  getReferralById,
  updateReferralStatus,
};

