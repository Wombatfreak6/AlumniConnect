const { prisma } = require('../../config/database');

/**
 * Retrieves all canonical skills from the database catalog.
 * Supports optional search filtering.
 */
async function getAllSkills(searchQuery = '') {
  const where = {};

  if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length > 0) {
    where.name = {
      contains: searchQuery.trim(),
      mode: 'insensitive',
    };
  }

  const skills = await prisma.skill.findMany({
    where,
    orderBy: {
      name: 'asc',
    },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          userSkills: true,
        },
      },
    },
  });

  return skills.map((s) => ({
    id: s.id,
    name: s.name,
    userCount: s._count.userSkills,
  }));
}

module.exports = {
  getAllSkills,
};
