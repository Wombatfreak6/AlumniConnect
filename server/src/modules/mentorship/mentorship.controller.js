const service = require('./mentorship.service');

function parseId(value) {
  const id = Number(value);
  return /^\d+$/.test(value) && Number.isInteger(id) && id > 0 ? id : null;
}

const send = (res, data, message = 'Request completed.') =>
  res.json({ success: true, message, data });

const invalidId = (res, label) =>
  res.status(400).json({ success: false, message: `Invalid ${label} id.` });

async function slots(req, res, next) {
  try {
    const slots = await service.listSlots({
      skill: req.query.skill,
      expertise: req.query.expertise,
      studentId: req.user.id,
    });
    send(res, { slots });
  } catch (error) {
    next(error);
  }
}

async function mySlots(req, res, next) {
  try {
    send(res, { slots: await service.getMySlots(req.user.id) });
  } catch (error) {
    next(error);
  }
}

async function getSlot(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return invalidId(res, 'slot');
    send(res, { slot: await service.getSlot(id, req.user.id) });
  } catch (error) {
    next(error);
  }
}

async function createSlot(req, res, next) {
  try {
    if (!req.body.topic || !req.body.startTime || !req.body.endTime) {
      return res.status(400).json({
        success: false,
        message: 'topic, startTime and endTime are required.',
      });
    }
    const slot = await service.createSlot(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Mentorship slot created.',
      data: { slot },
    });
  } catch (error) {
    next(error);
  }
}

async function updateSlot(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return invalidId(res, 'slot');
    const slot = await service.updateSlot(id, req.user.id, req.body, req.user.role);
    send(res, { slot });
  } catch (error) {
    next(error);
  }
}

async function deleteSlot(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return invalidId(res, 'slot');
    await service.deleteSlot(id, req.user.id, req.user.role);
    send(res, {}, 'Mentorship slot cancelled.');
  } catch (error) {
    next(error);
  }
}

async function createRequest(req, res, next) {
  try {
    const slotId = parseId(req.body.slotId);
    if (!slotId) {
      return res.status(400).json({ success: false, message: 'A valid slotId is required.' });
    }
    const request = await service.createRequest(req.user.id, slotId, req.body.message);
    res.status(201).json({
      success: true,
      message: 'Mentorship request sent.',
      data: { request },
    });
  } catch (error) {
    next(error);
  }
}

async function requests(req, res, next) {
  try {
    const list = await service.getRequests(req.user.id, req.user.role, req.params.direction);
    send(res, { requests: list });
  } catch (error) {
    next(error);
  }
}

async function updateRequest(req, res, next) {
  try {
    const id = parseId(req.params.id);
    if (!id) return invalidId(res, 'request');
    const request = await service.updateRequest(id, req.user.id, req.user.role, req.body.status);
    send(res, { request });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  slots,
  mySlots,
  getSlot,
  createSlot,
  updateSlot,
  deleteSlot,
  createRequest,
  requests,
  updateRequest,
};
