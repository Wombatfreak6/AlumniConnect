require('dotenv').config();
const bcrypt = require('bcryptjs');
const { prisma, disconnectDB } = require('../src/config/database');
const config = require('../src/config');

/**
 * Admin Seeding Script
 * Securely creates or updates the root administrator account using ADMIN_EMAIL and ADMIN_PASSWORD.
 * Guarantees that ADMIN creation is restricted exclusively to deliberate administrative execution.
 */
async function seedAdmin() {
  console.log('--- Initializing Admin User Seed ---');

  const adminEmail = (config.adminEmail || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = config.adminPassword || process.env.ADMIN_PASSWORD || '';

  if (!adminEmail || !adminPassword || adminPassword.length < 12 || !/[A-Z]/.test(adminPassword) || !/[a-z]/.test(adminPassword) || !/\d/.test(adminPassword) || !/[^A-Za-z0-9]/.test(adminPassword)) {
    throw new Error('Set ADMIN_EMAIL and a unique ADMIN_PASSWORD with at least 12 characters, uppercase, lowercase, a number, and a symbol.');
  }

  // Hash admin password with salt rounds = 10
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
      passwordHash,
    },
    create: {
      name: 'System Administrator',
      email: adminEmail,
      role: 'ADMIN',
      isActive: true,
      passwordHash,
      profile: {
        create: {
          bio: 'Initial platform administrator account.',
        },
      },
    },
  });

  console.log(`[Seed] Administrator account configured successfully:`);
  console.log(`       User ID: ${admin.id}`);
  console.log(`       Email:   ${admin.email}`);
  console.log(`       Role:    ${admin.role}`);
  console.log('--- Admin Seeding Completed Cleanly ---');
}

seedAdmin()
  .catch((error) => {
    console.error('[Seed Error] Failed to seed admin user:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });

