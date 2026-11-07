const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const config = require('./index');

let prisma;
let pool;

/**
 * Initializes and returns a singleton PrismaClient instance
 * configured with PostgreSQL driver adapter.
 */
function getPrismaClient() {
  if (!prisma) {
    if (config.databaseUrl) {
      pool = new Pool({ connectionString: config.databaseUrl });
      const adapter = new PrismaPg(pool);
      prisma = new PrismaClient({ adapter });
    } else {
      prisma = new PrismaClient();
    }
  }
  return prisma;
}

prisma = getPrismaClient();

/**
 * Verifies database connectivity.
 */
async function connectDB() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[Database] PostgreSQL connected successfully via Prisma');
    return true;
  } catch (error) {
    console.error('[Database] Connection failed:', error.message);
    throw error;
  }
}

/**
 * Disconnects Prisma client and drains the PostgreSQL connection pool cleanly.
 */
async function disconnectDB() {
  try {
    if (prisma) {
      await prisma.$disconnect();
      console.log('[Database] Prisma client disconnected');
    }
    if (pool) {
      await pool.end();
      console.log('[Database] PostgreSQL pool drained');
    }
  } catch (error) {
    console.error('[Database] Disconnect error:', error.message);
  }
}

module.exports = {
  prisma,
  connectDB,
  disconnectDB,
};
