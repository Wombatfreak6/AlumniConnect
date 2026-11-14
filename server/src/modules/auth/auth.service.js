const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const { prisma } = require('../../config/database');

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

async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

async function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

async function registerUser({ name, email, password, role }) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    const error = new Error('Email is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  // Har naye user ke saath ek khaali Profile bhi bana dete hain.
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

  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: true,
    },
  });

  // Same error for unknown email and wrong password, taaki account existence leak na ho.
  if (!user || !user.isActive) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;

  return {
    user: safeUser,
    token,
  };
}

module.exports = {
  generateToken,
  hashPassword,
  comparePassword,
  registerUser,
  loginUser,
};
