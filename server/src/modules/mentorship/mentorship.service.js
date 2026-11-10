const { prisma } = require('../../config/database');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const slotInclude = { alumni: { select: { id: true, name: true, profile: true, userSkills: { include: { skill: true } } } }, requests: { where: { status: { in: ['PENDING', 'ACCEPTED'] } }, select: { id: true, studentId: true, status: true } } };

async function listSlots(filters = {}) {
  const where = { status: 'AVAILABLE', startTime: { gt: new Date() } };
  if (filters.alumniId) where.alumniId = filters.alumniId;
  const slots = await prisma.mentorshipSlot.findMany({ where, include: { alumni: { select: { id: true, name: true, profile: true, userSkills: { include: { skill: true } } } } }, orderBy: { startTime: 'asc' } });
  const search = (filters.skill || filters.expertise || '').trim().toLowerCase();
  if (search) return slots.filter((slot) => slot.topic.toLowerCase().includes(search) || slot.expertise?.toLowerCase().includes(search) || slot.alumni.userSkills.some(({ skill }) => skill.name.toLowerCase().includes(search)));
  return slots;
}

async function createSlot(alumniId, input) {
  const startTime = new Date(input.startTime); const endTime = new Date(input.endTime);
  if (!Number.isFinite(+startTime) || !Number.isFinite(+endTime) || startTime <= new Date() || endTime <= startTime) throw fail('Choose a future start time and an end time after it.');
  const conflict = await prisma.mentorshipSlot.findFirst({ where: { alumniId, status: { in: ['AVAILABLE', 'BOOKED'] }, startTime: { lt: endTime }, endTime: { gt: startTime } } });
  if (conflict) throw fail('This time overlaps another mentorship slot.');
  return prisma.mentorshipSlot.create({ data: { alumniId, topic: input.topic.trim(), description: input.description?.trim() || null, expertise: input.expertise?.trim() || null, startTime, endTime } });
}

async function updateSlot(id, alumniId, input, role) {
  const slot = await prisma.mentorshipSlot.findUnique({ where: { id } });
  if (!slot) throw fail('Mentorship slot not found.', 404);
  if (role !== 'ADMIN' && slot.alumniId !== alumniId) throw fail('You can only manage your own mentorship slots.', 403);
  if (slot.status === 'BOOKED') throw fail('Booked slots cannot be edited or removed.');
  const data = {};
  for (const field of ['topic', 'description', 'expertise']) if (input[field] !== undefined) data[field] = input[field]?.trim() || null;
  if (input.startTime || input.endTime) {
    const startTime = new Date(input.startTime || slot.startTime); const endTime = new Date(input.endTime || slot.endTime);
    if (!Number.isFinite(+startTime) || !Number.isFinite(+endTime) || startTime <= new Date() || endTime <= startTime) throw fail('Choose a future start time and an end time after it.');
    const conflict = await prisma.mentorshipSlot.findFirst({ where: { id: { not: id }, alumniId: slot.alumniId, status: { in: ['AVAILABLE', 'BOOKED'] }, startTime: { lt: endTime }, endTime: { gt: startTime } } });
    if (conflict) throw fail('This time overlaps another mentorship slot.');
    data.startTime = startTime; data.endTime = endTime;
  }
  return prisma.mentorshipSlot.update({ where: { id }, data });
}

async function deleteSlot(id, userId, role) {
  const slot = await prisma.mentorshipSlot.findUnique({ where: { id }, include: { requests: true } });
  if (!slot) throw fail('Mentorship slot not found.', 404);
  if (role !== 'ADMIN' && slot.alumniId !== userId) throw fail('You can only manage your own mentorship slots.', 403);
  if (slot.requests.some((r) => r.status === 'ACCEPTED')) throw fail('A slot with an accepted request cannot be deleted.');
  await prisma.mentorshipSlot.update({ where: { id }, data: { status: 'CANCELLED' } });
}

async function createRequest(studentId, slotId, message) {
  const slot = await prisma.mentorshipSlot.findUnique({ where: { id: slotId } });
  if (!slot) throw fail('Mentorship slot not found.', 404);
  if (slot.alumniId === studentId) throw fail('You cannot request your own mentorship slot.');
  if (slot.status !== 'AVAILABLE' || slot.startTime <= new Date()) throw fail('This mentorship slot is no longer available.');
  return prisma.mentorshipRequest.create({ data: { studentId, slotId, message: message?.trim() || null } });
}

async function getRequests(userId, role, direction) {
  const where = direction === 'sent' ? { studentId: userId } : role === 'ADMIN' ? {} : { slot: { alumniId: userId } };
  return prisma.mentorshipRequest.findMany({ where, include: { student: { select: { id: true, name: true, email: true, profile: true } }, slot: { include: { alumni: { select: { id: true, name: true, profile: true } } } } }, orderBy: { createdAt: 'desc' } });
}

async function updateRequest(id, userId, role, status) {
  const request = await prisma.mentorshipRequest.findUnique({ where: { id }, include: { slot: true } });
  if (!request) throw fail('Mentorship request not found.', 404);
  if (status === 'CANCELLED') {
    if (request.studentId !== userId && role !== 'ADMIN') throw fail('Only the requesting student can cancel this request.', 403);
    if (request.status !== 'PENDING') throw fail('Only pending requests can be cancelled.');
    return prisma.mentorshipRequest.update({ where: { id }, data: { status } });
  }
  if (role !== 'ADMIN' && request.slot.alumniId !== userId) throw fail('Only the slot owner can manage this request.', 403);
  if (!['ACCEPTED', 'REJECTED'].includes(status) || request.status !== 'PENDING') throw fail('Only pending requests can be accepted or rejected.');
  if (status === 'ACCEPTED') {
    return prisma.$transaction(async (tx) => {
      const claimed = await tx.mentorshipSlot.updateMany({ where: { id: request.slotId, status: 'AVAILABLE', startTime: { gt: new Date() } }, data: { status: 'BOOKED' } });
      if (claimed.count !== 1) throw fail('This slot is no longer available.');
      const updated = await tx.mentorshipRequest.update({ where: { id }, data: { status } });
      return updated;
    });
  }
  return prisma.mentorshipRequest.update({ where: { id }, data: { status } });
}

module.exports = { listSlots, createSlot, updateSlot, deleteSlot, createRequest, getRequests, updateRequest };
