const { prisma } = require('../../config/database');

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

  // Admin ko bhi deactivate mat hone do, warna console lock ho sakta hai.
  if (existing.role === 'ADMIN' && !isActive) {
    const error = new Error('Cannot deactivate a System Administrator account.');
    error.statusCode = 400;
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

async function getPlatformStats() {
  const [users, students, alumni, jobPosts, mentorshipRequests, events] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'ALUMNI' } }),
    prisma.jobPost.count(),
    prisma.mentorshipRequest.count(),
    prisma.event.count(),
  ]);
  return { users, students, alumni, jobPosts, mentorshipRequests, events };
}

module.exports = {
  listAllUsers,
  getUserDetails,
  updateUserStatus,
  getPlatformStats,
};
