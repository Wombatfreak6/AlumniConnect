const { prisma } = require('../../config/database');
const { notifySafely } = require('../notifications/notifications.service');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

const mentorInclude = {
  id: true,
  name: true,
  profile: {
    select: {
      company: true,
      designation: true,
      industry: true,
      branch: true,
      college: true,
      graduationYear: true,
      bio: true,
      linkedinUrl: true,
    },
  },
  userSkills: { include: { skill: true } },
};

async function serializable(work) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(work, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (error.code !== 'P2034') throw error;
      if (attempt === 2) {
        throw fail('Mentorship availability changed concurrently. Please retry.', 409);
      }
    }
  }
}

function validateTopic(topic) {
  if (typeof topic !== 'string' || topic.trim().length < 3 || topic.trim().length > 160) {
    throw fail('Topic must be between 3 and 160 characters.');
  }
}

function validateOptionalText(field, value) {
  if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > 1000)) {
    throw fail(`${field} must be text up to 1000 characters.`);
  }
}

function parseTimeRange(startInput, endInput) {
  const startTime = new Date(startInput);
  const endTime = new Date(endInput);
  if (
    !Number.isFinite(+startTime) ||
    !Number.isFinite(+endTime) ||
    startTime <= new Date() ||
    endTime <= startTime
  ) {
    throw fail('Choose a future start time and an end time after it.');
  }
  return { startTime, endTime };
}

async function listSlots(filters = {}) {
  const where = { status: 'AVAILABLE', startTime: { gt: new Date() } };
  if (filters.alumniId) where.alumniId = filters.alumniId;

  const slots = await prisma.mentorshipSlot.findMany({
    where,
    include: {
      alumni: { select: mentorInclude },
      requests: { where: { studentId: filters.studentId }, select: { status: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  const search = (filters.skill || filters.expertise || '').trim().toLowerCase();
  if (!search) return slots;

  return slots.filter((slot) => {
    const profile = slot.alumni.profile;
    return (
      slot.topic.toLowerCase().includes(search) ||
      slot.expertise?.toLowerCase().includes(search) ||
      profile?.industry?.toLowerCase().includes(search) ||
      profile?.company?.toLowerCase().includes(search) ||
      slot.alumni.userSkills.some(({ skill }) => skill.name.toLowerCase().includes(search))
    );
  });
}

async function getMySlots(alumniId) {
  return prisma.mentorshipSlot.findMany({
    where: { alumniId, startTime: { gt: new Date() } },
    include: { requests: { select: { id: true, studentId: true, status: true } } },
    orderBy: { startTime: 'asc' },
  });
}

async function getSlot(id, studentId) {
  const slot = await prisma.mentorshipSlot.findFirst({
    where: { id, status: 'AVAILABLE', startTime: { gt: new Date() } },
    include: {
      alumni: { select: mentorInclude },
      requests: { where: { studentId }, select: { status: true } },
    },
  });
  if (!slot) throw fail('Available mentorship slot not found.', 404);
  return slot;
}

async function createSlot(alumniId, input) {
  validateTopic(input.topic);
  validateOptionalText('description', input.description);
  validateOptionalText('expertise', input.expertise);

  const { startTime, endTime } = parseTimeRange(input.startTime, input.endTime);

  return serializable(async (tx) => {
    const conflict = await tx.mentorshipSlot.findFirst({
      where: {
        alumniId,
        status: { in: ['AVAILABLE', 'BOOKED'] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (conflict) throw fail('This time overlaps another mentorship slot.', 409);

    return tx.mentorshipSlot.create({
      data: {
        alumniId,
        topic: input.topic.trim(),
        description: input.description?.trim() || null,
        expertise: input.expertise?.trim() || null,
        startTime,
        endTime,
      },
    });
  });
}

async function updateSlot(id, alumniId, input, role) {
  const slot = await prisma.mentorshipSlot.findUnique({ where: { id } });
  if (!slot) throw fail('Mentorship slot not found.', 404);
  if (role !== 'ADMIN' && slot.alumniId !== alumniId) {
    throw fail('You can only manage your own mentorship slots.', 403);
  }
  if (slot.status === 'BOOKED') throw fail('Booked slots cannot be edited or removed.');

  const data = {};
  for (const field of ['topic', 'description', 'expertise']) {
    if (input[field] === undefined) continue;
    if (field === 'topic') validateTopic(input.topic);
    else validateOptionalText(field, input[field]);
    data[field] = input[field]?.trim() || null;
  }

  if (input.startTime !== undefined || input.endTime !== undefined) {
    const startInput = input.startTime === undefined ? slot.startTime : input.startTime;
    const endInput = input.endTime === undefined ? slot.endTime : input.endTime;
    const { startTime, endTime } = parseTimeRange(startInput, endInput);
    data.startTime = startTime;
    data.endTime = endTime;
  }

  return serializable(async (tx) => {
    const current = await tx.mentorshipSlot.findUnique({ where: { id } });
    if (!current || current.status !== 'AVAILABLE') {
      throw fail('Only available slots can be edited.', 409);
    }

    if (data.startTime || data.endTime) {
      const conflict = await tx.mentorshipSlot.findFirst({
        where: {
          id: { not: id },
          alumniId: slot.alumniId,
          status: { in: ['AVAILABLE', 'BOOKED'] },
          startTime: { lt: data.endTime },
          endTime: { gt: data.startTime },
        },
      });
      if (conflict) throw fail('This time overlaps another mentorship slot.', 409);
    }

    return tx.mentorshipSlot.update({ where: { id }, data });
  });
}

async function deleteSlot(id, userId, role) {
  const slot = await prisma.mentorshipSlot.findUnique({
    where: { id },
    include: { requests: true },
  });
  if (!slot) throw fail('Mentorship slot not found.', 404);
  if (role !== 'ADMIN' && slot.alumniId !== userId) {
    throw fail('You can only manage your own mentorship slots.', 403);
  }
  if (slot.requests.some((request) => request.status === 'ACCEPTED')) {
    throw fail('A slot with an accepted request cannot be deleted.');
  }

  return serializable(async (tx) => {
    const current = await tx.mentorshipSlot.findUnique({ where: { id } });
    if (!current || current.status !== 'AVAILABLE') {
      throw fail('Only available slots can be cancelled.', 409);
    }

    await tx.mentorshipRequest.updateMany({
      where: { slotId: id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    await tx.mentorshipSlot.update({ where: { id }, data: { status: 'CANCELLED' } });
  });
}

async function createRequest(studentId, slotId, message) {
  if (
    message !== undefined &&
    message !== null &&
    (typeof message !== 'string' || message.trim().length > 1000)
  ) {
    throw fail('Message must be text up to 1000 characters.');
  }

  let request;
  try {
    request = await serializable(async (tx) => {
      const slot = await tx.mentorshipSlot.findUnique({ where: { id: slotId } });
      if (!slot) throw fail('Mentorship slot not found.', 404);
      if (slot.alumniId === studentId) throw fail('You cannot request your own mentorship slot.');
      if (slot.status !== 'AVAILABLE' || slot.startTime <= new Date()) {
        throw fail('This mentorship slot is no longer available.', 409);
      }

      return tx.mentorshipRequest.create({
        data: { studentId, slotId, message: message?.trim() || null },
        include: { slot: { select: { alumniId: true, topic: true } } },
      });
    });
  } catch (error) {
    // Ek student ek hi slot ke liye dobara request nahi bhej sakta.
    if (error.code === 'P2002') throw fail('You have already requested this mentorship slot.', 409);
    throw error;
  }

  await notifySafely({
    userId: request.slot.alumniId,
    type: 'MENTORSHIP_REQUEST',
    title: 'New mentorship request',
    message: `A student requested your “${request.slot.topic}” mentorship slot.`,
    href: '/mentorship/manage',
  });

  return request;
}

async function getRequests(userId, role, direction) {
  let where;
  if (direction === 'sent') where = { studentId: userId };
  else if (role === 'ADMIN') where = {};
  else where = { slot: { alumniId: userId } };

  return prisma.mentorshipRequest.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true, profile: true } },
      slot: { include: { alumni: { select: { id: true, name: true, profile: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function updateRequest(id, userId, role, status) {
  const request = await prisma.mentorshipRequest.findUnique({
    where: { id },
    include: { slot: true },
  });
  if (!request) throw fail('Mentorship request not found.', 404);

  if (status === 'CANCELLED') {
    if (request.studentId !== userId && role !== 'ADMIN') {
      throw fail('Only the requesting student can cancel this request.', 403);
    }
    if (request.status !== 'PENDING') throw fail('Only pending requests can be cancelled.');

    const cancelled = await prisma.mentorshipRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: { status },
    });
    if (cancelled.count !== 1) throw fail('This request has already been handled.', 409);

    const cancelledRequest = await prisma.mentorshipRequest.findUnique({ where: { id } });
    await notifySafely({
      userId: request.slot.alumniId,
      type: 'MENTORSHIP_STATUS',
      title: 'Mentorship request cancelled',
      message: `A student cancelled a request for “${request.slot.topic}”.`,
      href: '/mentorship/manage',
    });
    return cancelledRequest;
  }

  if (role !== 'ADMIN' && request.slot.alumniId !== userId) {
    throw fail('Only the slot owner can manage this request.', 403);
  }
  if (!['ACCEPTED', 'REJECTED'].includes(status) || request.status !== 'PENDING') {
    throw fail('Only pending requests can be accepted or rejected.');
  }

  let updated;
  if (status === 'ACCEPTED') {
    // Slot pehle claim karo, phir request accept karo; warna do students same slot book kar sakte hain.
    updated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.mentorshipSlot.updateMany({
        where: { id: request.slotId, status: 'AVAILABLE', startTime: { gt: new Date() } },
        data: { status: 'BOOKED' },
      });
      if (claimed.count !== 1) throw fail('This slot is no longer available.');

      const accepted = await tx.mentorshipRequest.updateMany({
        where: { id, status: 'PENDING' },
        data: { status },
      });
      if (accepted.count !== 1) throw fail('This request has already been handled.', 409);

      return tx.mentorshipRequest.findUnique({ where: { id } });
    });
  } else {
    const rejected = await prisma.mentorshipRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: { status },
    });
    if (rejected.count !== 1) throw fail('This request has already been handled.', 409);
    updated = await prisma.mentorshipRequest.findUnique({ where: { id } });
  }

  await notifySafely({
    userId: request.studentId,
    type: 'MENTORSHIP_STATUS',
    title: 'Mentorship request updated',
    message: `Your request for “${request.slot.topic}” was ${status.toLowerCase()}.`,
    href: '/mentorship/requests',
  });

  return updated;
}

module.exports = {
  listSlots,
  getMySlots,
  getSlot,
  createSlot,
  updateSlot,
  deleteSlot,
  createRequest,
  getRequests,
  updateRequest,
};
