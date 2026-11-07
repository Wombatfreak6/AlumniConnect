const { prisma } = require('../../config/database');

/**
 * Retrieves paginated list of users with multi-parameter filtering for administrative oversight.
 */
async function listAllUsers({ page, limit, role, isActive, search }) {
  const where = {};

  if (role) {
    where.role = role;
  }

  if (isActive !== null) {
    where.isActive = isActive;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        _count: {
          select: {
            userSkills: true,
            jobPosts: true,
            studentReferrals: true,
            alumniReferrals: true,
            mentorshipSlots: true,
            mentorshipRequests: true,
            organizedEvents: true,
            eventRegistrations: true,
          },
        },
      },
    }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Retrieves comprehensive user information for administrative audit.
 */
async function getUserDetails(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      userSkills: {
        select: {
          id: true,
          skill: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          jobPosts: true,
          studentReferrals: true,
          alumniReferrals: true,
          mentorshipSlots: true,
          mentorshipRequests: true,
          organizedEvents: true,
          eventRegistrations: true,
        },
      },
    },
  });

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

/**
 * Activates or deactivates a user account.
 * Prohibits an administrator from deactivating their own account.
 */
async function updateUserStatus(targetUserId, isActive, adminUserId) {
  if (targetUserId === adminUserId && !isActive) {
    const error = new Error('Cannot deactivate your own administrator account.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!existing) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return updatedUser;
}

module.exports = {
  listAllUsers,
  getUserDetails,
  updateUserStatus,
};
