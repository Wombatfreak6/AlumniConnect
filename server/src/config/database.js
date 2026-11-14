const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const config = require('./index');

let prisma;
let pool;

// Build the Prisma client once and reuse it everywhere.
function getPrismaClient() {
  if (!prisma) {
    const connectionString = config.databaseUrl || process.env.DATABASE_URL || 'postgresql://localhost:5432/alumni_connect?schema=public';
    pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

prisma = getPrismaClient();

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
