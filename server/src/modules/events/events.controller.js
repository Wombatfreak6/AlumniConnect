const service = require('./events.service');
const idOf = (value) => /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null;
function id(req, res) { const value = idOf(req.params.id); if (!value) { res.status(400).json({ success: false, message: 'Invalid event id.' }); return null; } return value; }
const ok = (res, data, message = 'Request completed.') => res.json({ success: true, message, data });
async function list(req, res, next) { try { ok(res, { events: await service.list(req.query) }); } catch (e) { next(e); } }
async function get(req, res, next) { try { const eventId = id(req, res); if (eventId) ok(res, { event: await service.get(eventId, req.user.id) }); } catch (e) { next(e); } }
async function create(req, res, next) { try { const event = await service.create(req.user.id, req.body); res.status(201); ok(res, { event }, 'Event created.'); } catch (e) { next(e); } }
async function update(req, res, next) { try { const eventId = id(req, res); if (eventId) ok(res, { event: await service.update(eventId, req.user.id, req.user.role, req.body) }, 'Event updated.'); } catch (e) { next(e); } }
async function remove(req, res, next) { try { const eventId = id(req, res); if (eventId) { await service.remove(eventId, req.user.id, req.user.role); ok(res, {}, 'Event deleted.'); } } catch (e) { next(e); } }
async function register(req, res, next) { try { const eventId = id(req, res); if (eventId) { const registration = await service.register(eventId, req.user.id); res.status(201); ok(res, { registration }, 'Registered for event.'); } } catch (e) { next(e); } }
async function cancel(req, res, next) { try { const eventId = id(req, res); if (eventId) ok(res, { registration: await service.cancel(eventId, req.user.id) }, 'Registration cancelled.'); } catch (e) { next(e); } }
async function mine(req, res, next) { try { ok(res, { registrations: await service.mine(req.user.id) }); } catch (e) { next(e); } }
async function participants(req, res, next) { try { const eventId = id(req, res); if (eventId) ok(res, { participants: await service.participants(eventId, req.user.id, req.user.role) }); } catch (e) { next(e); } }
module.exports = { list, get, create, update, remove, register, cancel, mine, participants };
