const service = require('./events.service');

function parseId(value) {
  const id = Number(value);
  return /^\d+$/.test(value) && Number.isInteger(id) && id > 0 ? id : null;
}

function eventId(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, message: 'Invalid event id.' });
    return null;
  }
  return id;
}

const send = (res, data, message = 'Request completed.') =>
  res.json({ success: true, message, data });

async function list(req, res, next) {
  try {
    send(res, { events: await service.list(req.query) });
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    const id = eventId(req, res);
    if (id) send(res, { event: await service.get(id, req.user.id) });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const event = await service.create(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Event created.', data: { event } });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const id = eventId(req, res);
    if (id) {
      const event = await service.update(id, req.user.id, req.user.role, req.body);
      send(res, { event }, 'Event updated.');
    }
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const id = eventId(req, res);
    if (id) {
      await service.remove(id, req.user.id, req.user.role);
      send(res, {}, 'Event deleted.');
    }
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  try {
    const id = eventId(req, res);
    if (id) {
      const registration = await service.register(id, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Registered for event.',
        data: { registration },
      });
    }
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const id = eventId(req, res);
    if (id) {
      const registration = await service.cancel(id, req.user.id);
      send(res, { registration }, 'Registration cancelled.');
    }
  } catch (error) {
    next(error);
  }
}

async function mine(req, res, next) {
  try {
    send(res, { registrations: await service.mine(req.user.id) });
  } catch (error) {
    next(error);
  }
}

async function participants(req, res, next) {
  try {
    const id = eventId(req, res);
    if (id) {
      const list = await service.participants(id, req.user.id, req.user.role);
      send(res, { participants: list });
    }
  } catch (error) {
    next(error);
  }
}

module.exports = { list, get, create, update, remove, register, cancel, mine, participants };
