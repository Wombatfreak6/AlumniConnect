const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables from server/.env, falling back to root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const providedJwtSecret = process.env.JWT_SECRET;
const isPlaceholderSecret = !providedJwtSecret || /change.?me|placeholder|your.jwt|generate-a-unique|replace-with/i.test(providedJwtSecret);
if (nodeEnv === 'production' && (isPlaceholderSecret || providedJwtSecret.length < 32)) {
  throw new Error('Production requires a non-placeholder JWT_SECRET of at least 32 characters.');
}

// Generate a process-local key for development when no local .env is configured.
// This deliberately invalidates dev sessions on restart and is never allowed in production.
const jwtSecret = isPlaceholderSecret ? crypto.randomBytes(32).toString('hex') : providedJwtSecret;

const config = {
  port: process.env.PORT || 5001,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/alumni_connect?schema=public',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@alumniconnect.edu',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  email: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || '',
  },
  cookie: {
    name: 'token',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  },
};

module.exports = config;
