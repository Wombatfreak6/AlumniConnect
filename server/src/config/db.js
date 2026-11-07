// Backwards-compatible proxy pointing to database.js singleton
const { prisma, connectDB, disconnectDB } = require('./database');

module.exports = prisma;
module.exports.prisma = prisma;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
