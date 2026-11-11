const { prisma } = require('../../config/database');
const { sendNotificationEmail } = require('./mailer');

const connections = new Map();
const pendingEmailDeliveries = new Set();

function publish(userId, notification) {
  const clients = connections.get(userId);
  if (!clients) return;
  const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
  for (const response of clients) {
    if (response.destroyed || response.writableEnded) {
      clients.delete(response);
      continue;
    }
    response.write(payload);
  }
  if (clients.size === 0) connections.delete(userId);
}

async function notify({ userId, type, title, message, href }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, href: href || null },
  });
  publish(userId, notification);

  const delivery = prisma.user.findUnique({ where: { id: userId }, select: { email: true, isActive: true } })
    .then((user) => user?.isActive && sendNotificationEmail(user.email, { title, message, href }))
    .catch((error) => console.error('[Email] Notification delivery failed:', error.message));
  pendingEmailDeliveries.add(delivery);
  void delivery.finally(() => pendingEmailDeliveries.delete(delivery));
  return notification;
}

async function notifySafely(payload) {
  try {
    return await notify(payload);
  } catch (error) {
    console.error('[Notifications] Could not save notification:', error.message);
    return null;
  }
}

async function list(userId, limit = 20) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return { notifications, unreadCount };
}

async function markRead(userId, id) {
  const result = await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data: { readAt: new Date() },
  });
  if (result.count === 0) {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw Object.assign(new Error('Notification not found.'), { statusCode: 404 });
    return notification;
  }
  return prisma.notification.findUnique({ where: { id } });
}

async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { updated: result.count };
}

function connectStream(userId, res) {
  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 5000\n: connected\n\n');

  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId).add(res);

  const heartbeat = setInterval(() => {
    if (!res.destroyed && !res.writableEnded) res.write(': heartbeat\n\n');
  }, 25000);
  heartbeat.unref?.();

  const close = () => {
    clearInterval(heartbeat);
    const clients = connections.get(userId);
    clients?.delete(res);
    if (clients?.size === 0) connections.delete(userId);
  };
  res.on('close', close);
}

async function flushEmailDeliveries() {
  await Promise.allSettled([...pendingEmailDeliveries]);
}

module.exports = { notifySafely, list, markRead, markAllRead, connectStream, flushEmailDeliveries };
