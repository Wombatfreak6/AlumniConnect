const { prisma } = require('../../config/database');

// passwordHash is deliberately not part of this selection.
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

  // Purane users ke paas profile missing ho sakti hai, toh yahin bana dete hain.
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

async function updateMyProfile(userId, { profileData, userName }) {
  await prisma.$transaction(async (tx) => {
    if (userName) {
      await tx.user.update({ where: { id: userId }, data: { name: userName } });
    }
    await tx.profile.upsert({
      where: { userId },
      update: profileData,
      create: { userId, ...profileData },
    });
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: SAFE_USER_SELECT,
  });

  return formatUserResponse(updatedUser);
}

async function getPublicProfileById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
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

  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return formatUserResponse(user);
}

async function addUserSkill(userId, { skillName, skillId }) {
  let targetSkillId = skillId;

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

  const skill = await prisma.skill.findUnique({
    where: { id: targetSkillId },
  });

  if (!skill) {
    const error = new Error('Skill not found in catalog.');
    error.statusCode = 404;
    throw error;
  }

  // Same skill ek user ke profile pe do baar nahi lag sakti.
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
