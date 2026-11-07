const { prisma } = require('../../config/database');

/**
 * Common safe selection for user public/profile discovery.
 * Strictly guarantees passwordHash and internal authentication flags are excluded.
 */
const SAFE_USER_SELECT = {
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
      createdAt: true,
      skill: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
};

/**
 * Formats user entity to simplify the userSkills array into clean skill objects.
 */
function formatUserResponse(user) {
  if (!user) return null;
  const { userSkills, ...rest } = user;
  return {
    ...rest,
    skills: userSkills
      ? userSkills.map((us) => ({
          userSkillId: us.id,
          id: us.skill.id,
          name: us.skill.name,
        }))
      : [],
  };
}

/**
 * Retrieves the full profile of the currently authenticated user.
 * Supports auto-creation of a blank profile if missing from legacy records.
 */
async function getMyProfile(userId) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  });

  if (!user) {
    const error = new Error('User account not found.');
    error.statusCode = 404;
    throw error;
  }

  // Ensure profile existence
  if (!user.profile) {
    await prisma.profile.create({
      data: { userId },
    });
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: SAFE_USER_SELECT,
    });
  }

  return formatUserResponse(user);
}

/**
 * Updates the authenticated user's profile and optional display name.
 */
async function updateMyProfile(userId, { profileData, userName }) {
  // 1. Update User name if supplied
  if (userName) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: userName },
    });
  }

  // 2. Upsert profile data
  await prisma.profile.upsert({
    where: { userId },
    update: profileData,
    create: {
      userId,
      ...profileData,
    },
  });

  // 3. Return refreshed user profile
  const updatedUser = await prisma.user.findUnique({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  });

  return formatUserResponse(updatedUser);
}

/**
 * Retrieves public profile by user ID for peer discovery.
 * Rejects inactive users and never leaks credentials.
 */
async function getPublicProfileById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
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
    },
  });

  if (!user || !user.isActive) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return formatUserResponse(user);
}

/**
 * Associates a skill with the authenticated user's profile.
 * Automatically normalizes skill name and prevents duplicates.
 */
async function addUserSkill(userId, { skillName, skillId }) {
  let targetSkillId = skillId;

  // If skillName provided, find case-insensitively or create new skill
  if (!targetSkillId && skillName) {
    const existingSkill = await prisma.skill.findFirst({
      where: {
        name: {
          equals: skillName,
          mode: 'insensitive',
        },
      },
    });

    if (existingSkill) {
      targetSkillId = existingSkill.id;
    } else {
      const createdSkill = await prisma.skill.create({
        data: { name: skillName },
      });
      targetSkillId = createdSkill.id;
    }
  }

  // Validate skill existence
  const skill = await prisma.skill.findUnique({
    where: { id: targetSkillId },
  });

  if (!skill) {
    const error = new Error('Skill not found in catalog.');
    error.statusCode = 404;
    throw error;
  }

  // Check for duplicate user-skill association
  const existingUserSkill = await prisma.userSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId: targetSkillId,
      },
    },
  });

  if (existingUserSkill) {
    const error = new Error('Skill is already attached to your profile.');
    error.statusCode = 409;
    throw error;
  }

  // Create join association
  const userSkill = await prisma.userSkill.create({
    data: {
      userId,
      skillId: targetSkillId,
    },
    include: {
      skill: true,
    },
  });

  return {
    userSkillId: userSkill.id,
    skillId: userSkill.skill.id,
    name: userSkill.skill.name,
  };
}

/**
 * Disassociates a skill from the authenticated user's profile.
 * Prevents unauthorized modification by enforcing userId matching.
 */
async function removeUserSkill(userId, skillId) {
  const existingUserSkill = await prisma.userSkill.findUnique({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
  });

  if (!existingUserSkill) {
    const error = new Error('Skill not found on your profile.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.userSkill.delete({
    where: {
      userId_skillId: {
        userId,
        skillId,
      },
    },
  });

  return true;
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicProfileById,
  addUserSkill,
  removeUserSkill,
  formatUserResponse,
};
