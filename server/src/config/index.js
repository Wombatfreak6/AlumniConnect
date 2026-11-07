const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from server/.env, falling back to root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const config = {
  port: process.env.PORT || 5001,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/alumni_connect?schema=public',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'alumniconnect_jwt_secret_placeholder',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@alumniconnect.edu',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@Secure2026!',
  cookie: {
    name: 'token',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
};

module.exports = config;
