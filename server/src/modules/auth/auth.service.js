const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const { prisma } = require('../../config/database');

/**
 * Generate a signed JSON Web Token
 * @param {Object} user User object containing id, email, role
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
}

/**
 * Hash a plain text password with bcrypt (salt rounds = 10)
 */
async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compare plain text password against stored bcrypt hash
 */
async function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Register a new Student or Alumni user
 */
async function registerUser({ name, email, password, role }) {
  // Check for duplicate email
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error = new Error('Email is already registered.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create User and auto-initialize 1-to-1 Profile
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      profile: {
        create: {},
      },
    },
    include: {
      profile: true,
    },
  });

  // Generate JWT token
  const token = generateToken(user);

  // Omit passwordHash from output
  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
}

/**
 * Authenticate credentials and generate session token
 */
async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
    },
  });

  // Generic failure for user not found or inactive account
  if (!user || !user.isActive) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Verify password hash
  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT token
  const token = generateToken(user);

  // Omit passwordHash from output
  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
}

/**
 * Retrieve user profile by user ID
 */
async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
    },
  });

  if (!user || !user.isActive) {
    const error = new Error('User not found or account deactivated.');
    error.statusCode = 404;
    throw error;
  }

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  registerUser,
  loginUser,
  getUserById,
};
