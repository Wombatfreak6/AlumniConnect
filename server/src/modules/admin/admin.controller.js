const adminService = require('./admin.service');
const { validateUserListQuery, validateStatusUpdate } = require('./admin.validation');
const { validateIntegerId } = require('../users/users.validation');

/**
 * GET /api/admin/users
 * Administrative endpoint to list users with filtering & pagination.
 */
async function getUsers(req, res, next) {
  try {
    const params = validateUserListQuery(req.query);
    const result = await adminService.listAllUsers(params);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users/:id
 * Administrative endpoint to fetch detailed user record.
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

    const user = await adminService.getUserDetails(id);

    res.status(200).json({
      success: true,
      message: 'User details retrieved successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Administrative endpoint to activate or deactivate a user account.
 */
async function updateStatus(req, res, next) {
  try {
    const { isValid: isIdValid, error: idError, id } = validateIntegerId(req.params.id, 'userId');

    if (!isIdValid) {
      return res.status(400).json({
        success: false,
        message: idError,
      });
    }

    const { isValid: isBodyValid, error: bodyError, isActive } = validateStatusUpdate(req.body);

    if (!isBodyValid) {
      return res.status(400).json({
        success: false,
        message: bodyError,
      });
    }

    const updatedUser = await adminService.updateUserStatus(id, isActive, req.user.id);

    res.status(200).json({
      success: true,
      message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await adminService.getPlatformStats();
    res.status(200).json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  getUserById,
  updateStatus,
  getStats,
};
