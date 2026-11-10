const { prisma } = require('../../config/database');
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const enums = { category: ['WEBINAR', 'WORKSHOP', 'REUNION', 'NETWORKING', 'CAREER_FAIR', 'TALK', 'OTHER'], eventType: ['VIRTUAL', 'IN_PERSON', 'HYBRID'] };
const include = { organizer: { select: { id: true, name: true, profile: { select: { company: true, designation: true } } } }, _count: { select: { registrations: { where: { status: 'REGISTERED' } } } } };
function validate(data, partial = false) {
  const required = ['title', 'description', 'category', 'location', 'eventType', 'startDate', 'endDate'];
  for (const key of required) if ((!partial || data[key] !== undefined) && typeof data[key] !== 'string' && !['startDate', 'endDate'].includes(key)) throw fail(`${key} must be a string.`);
  if (!partial) for (const key of required) if (!data[key] || (typeof data[key] === 'string' && !data[key].trim())) throw fail(`${key} is required.`);
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
  if (data.capacity !== undefined) { const count = await prisma.eventRegistration.count({ where: { eventId: id, status: 'REGISTERED' } }); if (data.capacity !== null && data.capacity < count) throw fail('Capacity cannot be lower than the number of registered participants.'); }
  return prisma.event.update({ where: { id }, data, include });
}
async function remove(id, userId, role) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw fail('Event not found.', 404);
  if (role !== 'ADMIN' && event.organizerId !== userId) throw fail('Only the event organizer or an administrator can delete it.', 403);
  await prisma.event.delete({ where: { id } });
}
async function register(id, userId) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id } });
    if (!event) throw fail('Event not found.', 404);
    const now = new Date();
    if (event.startDate <= now || (event.registrationDeadline && event.registrationDeadline <= now)) throw fail('Registration is closed for this event.');
    const existing = await tx.eventRegistration.findUnique({ where: { eventId_userId: { eventId: id, userId } } });
    if (existing?.status === 'REGISTERED' || existing?.status === 'ATTENDED') throw fail('You are already registered for this event.', 409);
    const count = await tx.eventRegistration.count({ where: { eventId: id, status: 'REGISTERED' } });
    if (event.capacity !== null && count >= event.capacity) throw fail('This event has reached capacity.', 409);
    return existing ? tx.eventRegistration.update({ where: { id: existing.id }, data: { status: 'REGISTERED', registeredAt: now } }) : tx.eventRegistration.create({ data: { eventId: id, userId } });
  }, { isolationLevel: 'Serializable' });
}
async function cancel(id, userId) {
  const registration = await prisma.eventRegistration.findUnique({ where: { eventId_userId: { eventId: id, userId } }, include: { event: true } });
  if (!registration || registration.status !== 'REGISTERED') throw fail('No active registration was found.', 404);
  if (registration.event.startDate <= new Date()) throw fail('Registrations cannot be cancelled after the event starts.');
  return prisma.eventRegistration.update({ where: { id: registration.id }, data: { status: 'CANCELLED' } });
}
async function mine(userId) { return prisma.eventRegistration.findMany({ where: { userId, status: { in: ['REGISTERED', 'ATTENDED'] } }, include: { event: { include } }, orderBy: { registeredAt: 'desc' } }); }
async function participants(id, userId, role) {
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) throw fail('Event not found.', 404);
  if (role !== 'ADMIN' && event.organizerId !== userId) throw fail('Only the event organizer or an administrator can view participants.', 403);
  return prisma.eventRegistration.findMany({ where: { eventId: id, status: 'REGISTERED' }, select: { id: true, status: true, registeredAt: true, user: { select: { id: true, name: true, email: true, role: true, profile: { select: { branch: true, graduationYear: true } } } } }, orderBy: { registeredAt: 'asc' } });
}
module.exports = { list, get, create, update, remove, register, cancel, mine, participants };
