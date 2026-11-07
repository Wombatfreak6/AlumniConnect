const usersService = require('./users.service');
const {
  validateProfileUpdate,
  validateSkillInput,
  validateIntegerId,
} = require('./users.validation');

/**
 * GET /api/users/me
 * Retrieves full profile of the logged-in user.
 */
async function getMe(req, res, next) {
  try {
    const user = await usersService.getMyProfile(req.user.id);
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/me
 * Updates the logged-in user's profile information.
 */
async function updateMe(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateProfileUpdate(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
      });
    }

    const updatedUser = await usersService.updateMyProfile(req.user.id, sanitized);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:id
 * Public discovery endpoint returning safe profile information.
 */
async function getUserById(req, res, next) {
  try {
    const { isValid, error, id } = validateIntegerId(req.params.id, 'userId');

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const user = await usersService.getPublicProfileById(id);

    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users/me/skills
 * Adds a skill to the authenticated user's profile.
 */
async function addSkill(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateSkillInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
      });
    }

    const skill = await usersService.addUserSkill(req.user.id, sanitized);

    res.status(201).json({
      success: true,
      message: 'Skill added to profile successfully',
      data: {
        skill,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/me/skills/:skillId
 * Removes a skill from the authenticated user's profile.
 */
async function removeSkill(req, res, next) {
  try {
    const { isValid, error, id: skillId } = validateIntegerId(req.params.skillId, 'skillId');

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    await usersService.removeUserSkill(req.user.id, skillId);

    res.status(200).json({
      success: true,
      message: 'Skill removed from profile successfully',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMe,
  updateMe,
  getUserById,
  addSkill,
  removeSkill,
};
