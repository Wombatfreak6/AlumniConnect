const service = require('./notifications.service');

async function list(req, res, next) {
  try {
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    res.json({ success: true, data: await service.list(req.user.id, limit) });
  } catch (error) {
    next(error);
  }
}

async function markRead(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: 'Invalid notification id.' });
    }
    const notification = await service.markRead(req.user.id, id);
    res.json({ success: true, data: { notification } });
  } catch (error) {
    next(error);
  }
}

async function markAllRead(req, res, next) {
  try {
    res.json({ success: true, data: await service.markAllRead(req.user.id) });
  } catch (error) {
    next(error);
  }
}

function stream(req, res, next) {
  try {
    service.connectStream(req.user.id, res);
  } catch (error) {
    next(error);
  }
}

module.exports = { list, markRead, markAllRead, stream };
