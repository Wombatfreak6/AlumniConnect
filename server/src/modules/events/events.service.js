const { prisma } = require('../../config/database');
const { notifySafely } = require('../notifications/notifications.service');
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const isSerializationConflict = (error) => error.code === 'P2034'
  || error.code === '40001'
  || error.code === '40P01'
  || /TransactionWriteConflict|serialization failure|could not serialize access|deadlock detected/i.test(error.message || '');
async function serializable(work) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(work, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (!isSerializationConflict(error)) throw error;
      if (attempt === 2) throw fail('Event capacity changed during registration. Please try again.', 409);
    }
  }
}
const enums = { category: ['WEBINAR', 'WORKSHOP', 'REUNION', 'NETWORKING', 'CAREER_FAIR', 'TALK', 'OTHER'], eventType: ['VIRTUAL', 'IN_PERSON', 'HYBRID'] };
const include = { organizer: { select: { id: true, name: true, profile: { select: { company: true, designation: true } } } }, _count: { select: { registrations: { where: { status: 'REGISTERED' } } } } };
function validate(data, partial = false) {
  const required = ['title', 'description', 'category', 'location', 'eventType', 'startDate', 'endDate'];
  for (const key of required) if ((!partial || data[key] !== undefined) && typeof data[key] !== 'string' && !['startDate', 'endDate'].includes(key)) throw fail(`${key} must be a string.`);
  if (!partial) for (const key of required) if (!data[key] || (typeof data[key] === 'string' && !data[key].trim())) throw fail(`${key} is required.`);
  const limits = { title: 160, description: 5000, location: 250 };
  for (const [key, limit] of Object.entries(limits)) {
    if (data[key] !== undefined && typeof data[key] === 'string') {
      if (key === 'title' && data[key].trim().length < 3) throw fail('title must contain at least 3 characters.');
      if (key === 'description' && data[key].trim().length < 10) throw fail('description must contain at least 10 characters.');
      if (key === 'location' && data[key].trim().length < 2) throw fail('location must contain at least 2 characters.');
      if (data[key].trim().length > limit) throw fail(`${key} cannot exceed ${limit} characters.`);
    }
  }
  if (data.category && !enums.category.includes(data.category)) throw fail('Invalid event category.');
  if (data.eventType && !enums.eventType.includes(data.eventType)) throw fail('Invalid event type.');
  const start = data.startDate ? new Date(data.startDate) : null; const end = data.endDate ? new Date(data.endDate) : null;
  if (start && (!Number.isFinite(+start) || start <= new Date())) throw fail('Event start must be a valid future date.');
  if (end && (!Number.isFinite(+end) || (start && end <= start))) throw fail('Event end must be later than its start.');
  if (data.registrationDeadline) { const deadline = new Date(data.registrationDeadline); if (!Number.isFinite(+deadline) || deadline >= (start || new Date('9999-12-31'))) throw fail('Registration deadline must be valid and before the event starts.'); }
  if (data.capacity !== undefined && data.capacity !== null && (!Number.isInteger(Number(data.capacity)) || Number(data.capacity) < 1)) throw fail('Capacity must be a positive whole number.');
  return Object.fromEntries(['title', 'description', 'category', 'location', 'eventType', 'startDate', 'endDate', 'registrationDeadline', 'capacity'].filter((key) => data[key] !== undefined).map((key) => [key, ['startDate', 'endDate', 'registrationDeadline'].includes(key) ? (data[key] ? new Date(data[key]) : null) : key === 'capacity' && data[key] !== null ? Number(data[key]) : typeof data[key] === 'string' ? data[key].trim() : data[key]]));
}
async function list(filters = {}) {
  const where = { startDate: { gt: new Date() } };
  if (filters.category && !enums.category.includes(filters.category)) throw fail('Invalid event category.');
  if (filters.category) where.category = filters.category;
  if (filters.search) where.OR = ['title', 'description', 'location'].map((field) => ({ [field]: { contains: filters.search, mode: 'insensitive' } }));
  return prisma.event.findMany({ where, include, orderBy: { startDate: 'asc' } });
}
async function get(id, userId) {
  const event = await prisma.event.findUnique({ where: { id }, include: { ...include, registrations: { where: { userId }, select: { status: true } } } });
  if (!event) throw fail('Event not found.', 404);
  return event;
}
async function create(organizerId, body) { return prisma.event.create({ data: { ...validate(body), organizerId }, include }); }
async function update(id, userId, role, body) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw fail('Event not found.', 404);
  if (role !== 'ADMIN' && event.organizerId !== userId) throw fail('Only the event organizer or an administrator can edit it.', 403);
  const data = validate({ title: event.title, description: event.description, category: event.category, location: event.location, eventType: event.eventType, startDate: event.startDate, endDate: event.endDate, registrationDeadline: event.registrationDeadline, capacity: event.capacity, ...body });
  const updated = await serializable(async (tx) => {
    if (data.capacity !== undefined) {
      const count = await tx.eventRegistration.count({ where: { eventId: id, status: 'REGISTERED' } });
      if (data.capacity !== null && data.capacity < count) throw fail('Capacity cannot be lower than the number of registered participants.', 409);
    }
    return tx.event.update({ where: { id }, data, include });
  });
  const attendees = await prisma.eventRegistration.findMany({ where: { eventId: id, status: 'REGISTERED' }, select: { userId: true } });
  await Promise.all(attendees.filter(({ userId: attendeeId }) => attendeeId !== event.organizerId).map(({ userId: attendeeId }) => notifySafely({
    userId: attendeeId, type: 'EVENT_UPDATE', title: 'Event details updated',
    message: `The organizer updated “${event.title}”.`, href: `/events/${id}`,
  })));
  return updated;
}
async function remove(id, userId, role) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw fail('Event not found.', 404);
  if (role !== 'ADMIN' && event.organizerId !== userId) throw fail('Only the event organizer or an administrator can delete it.', 403);
  const attendees = await prisma.eventRegistration.findMany({ where: { eventId: id, status: 'REGISTERED' }, select: { userId: true } });
  await prisma.event.delete({ where: { id } });
  await Promise.all(attendees.map(({ userId: attendeeId }) => notifySafely({
    userId: attendeeId, type: 'EVENT_UPDATE', title: 'Event cancelled',
    message: `“${event.title}” was cancelled by its organizer.`, href: '/events',
  })));
}
async function register(id, userId) {
  let eventInfo;
  try {
    const registration = await serializable(async (tx) => {
      const event = await tx.event.findUnique({ where: { id } });
      if (!event) throw fail('Event not found.', 404);
      eventInfo = { organizerId: event.organizerId, title: event.title };
      const now = new Date();
      if (event.startDate <= now || (event.registrationDeadline && event.registrationDeadline <= now)) throw fail('Registration is closed for this event.');
      const existing = await tx.eventRegistration.findUnique({ where: { eventId_userId: { eventId: id, userId } } });
      if (existing?.status === 'REGISTERED' || existing?.status === 'ATTENDED') throw fail('You are already registered for this event.', 409);
      const count = await tx.eventRegistration.count({ where: { eventId: id, status: 'REGISTERED' } });
      if (event.capacity !== null && count >= event.capacity) throw fail('This event has reached capacity.', 409);
      return existing ? tx.eventRegistration.update({ where: { id: existing.id }, data: { status: 'REGISTERED', registeredAt: now } }) : tx.eventRegistration.create({ data: { eventId: id, userId } });
    });
    if (eventInfo.organizerId !== userId) await notifySafely({
      userId: eventInfo.organizerId, type: 'EVENT_REGISTRATION', title: 'New event registration',
      message: `A participant registered for “${eventInfo.title}”.`, href: `/events/${id}`,
    });
    return registration;
  } catch (error) {
    if (error.code === 'P2002') throw fail('You are already registered for this event.', 409);
    throw error;
  }
}
async function cancel(id, userId) {
  const registration = await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId: id, userId } }, include: { event: true } });
  if (!registration || registration.status !== 'REGISTERED') throw fail('No active registration was found.', 404);
  if (registration.event.startDate <= new Date()) throw fail('Registrations cannot be cancelled after the event starts.');
  const cancelled = await prisma.eventRegistration.update({ where: { id: registration.id }, data: { status: 'CANCELLED' } });
  if (registration.event.organizerId !== userId) await notifySafely({
    userId: registration.event.organizerId, type: 'EVENT_REGISTRATION', title: 'Event registration cancelled',
    message: `A participant cancelled their registration for “${registration.event.title}”.`, href: `/events/${id}`,
  });
  return cancelled;
}
async function mine(userId) { return prisma.eventRegistration.findMany({ where: { userId, status: { in: ['REGISTERED', 'ATTENDED'] } }, include: { event: { include } }, orderBy: { registeredAt: 'desc' } }); }
async function participants(id, userId, role) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw fail('Event not found.', 404);
  if (role !== 'ADMIN' && event.organizerId !== userId) throw fail('Only the event organizer or an administrator can view participants.', 403);
  return prisma.eventRegistration.findMany({ where: { eventId: id, status: 'REGISTERED' }, select: { id: true, status: true, registeredAt: true, user: { select: { id: true, name: true, email: true, role: true, profile: { select: { branch: true, graduationYear: true } } } } }, orderBy: { registeredAt: 'asc' } });
}
module.exports = { list, get, create, update, remove, register, cancel, mine, participants };
