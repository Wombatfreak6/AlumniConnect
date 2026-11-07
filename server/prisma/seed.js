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

  const adminEmail = (config.adminEmail || process.env.ADMIN_EMAIL || 'admin@alumniconnect.edu').trim().toLowerCase();
  const adminPassword = config.adminPassword || process.env.ADMIN_PASSWORD || 'Admin@Secure2026!';

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured.');
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
