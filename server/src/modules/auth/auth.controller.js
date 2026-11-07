const authService = require('./auth.service');
const { validateRegisterInput, validateLoginInput } = require('./auth.validation');
const config = require('../../config');

/**
 * Register a new user (Student or Alumni)
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateRegisterInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
      });
    }

    const { user, token } = await authService.registerUser(sanitized);

    // Set secure HttpOnly cookie
    res.cookie(config.cookie.name, token, {
      maxAge: config.cookie.maxAge,
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Authenticate user credentials
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { isValid, errors, sanitized } = validateLoginInput(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors.join(' '),
      });
    }

    const { user, token } = await authService.loginUser(sanitized);

    // Set secure HttpOnly cookie
    res.cookie(config.cookie.name, token, {
      maxAge: config.cookie.maxAge,
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Terminate user session and clear authentication cookie
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    res.clearCookie(config.cookie.name, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Return current authenticated user profile
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    // req.user was attached by authenticateToken middleware
    res.status(200).json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
};
