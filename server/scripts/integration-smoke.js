const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error('Set TEST_DATABASE_URL in server/.env to a dedicated *_test database.');
const databaseName = new URL(testDatabaseUrl).pathname.split('/').pop().split('?')[0];
if (!/_test$/i.test(databaseName)) throw new Error('Refusing to run integration tests against a database not named *_test.');
process.env.DATABASE_URL = testDatabaseUrl;

const migration = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  cwd: path.resolve(__dirname, '..'),
  env: process.env,
  encoding: 'utf8',
});
if (migration.status !== 0) throw new Error(`Test database migration failed:\n${migration.stderr || migration.stdout}`);

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { SMTPServer } = require('smtp-server');
const app = require('../src/app');
const config = require('../src/config');
const notificationService = require('../src/modules/notifications/notifications.service');
const { prisma, connectDB, disconnectDB } = require('../src/config/database');

const userPassword = 'AlumniDemo!2026';
const checks = [];
const userIds = [];
const stamp = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
let registrationNumber = 0;
const base = { value: '' };

async function call(method, route, token, body) {
  const response = await fetch(`${base.value}${route}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await response.json(); } catch { /* Empty responses are valid for some endpoints. */ }
  return { status: response.status, data, headers: response.headers };
}

function check(name, result, expected) {
  const pass = expected.includes(result.status);
  checks.push({ name, status: result.status, pass });
  if (!pass) throw new Error(`${name}: got HTTP ${result.status}; expected ${expected.join('/')} (${result.data.message || 'no message'})`);
}

async function register(name, role) {
  const email = `${role.toLowerCase()}.${++registrationNumber}.${stamp}@integration.alumniconnect.test`;
  const result = await call('POST', '/api/auth/register', null, { name, email, password: userPassword, role });
  check(`register ${role}`, result, [201]);
  const user = result.data.data.user;
  userIds.push(user.id);
  return { email, id: user.id, token: result.data.data.token, cookie: result.headers.get('set-cookie')?.split(';')[0] };
}

async function login(email, password = userPassword) {
  const result = await call('POST', '/api/auth/login', null, { email, password });
  check('login', result, [200]);
  return result.data.data.token;
}

function future(days, minutes = 0) {
  return new Date(Date.now() + days * 86400000 + minutes * 60000).toISOString();
}

async function waitForNotification(reader, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out waiting for a real-time notification.')), timeoutMs);
    (async () => {
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) throw new Error('Notification stream closed before an event arrived.');
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';
      for (const frame of frames) {
        if (!frame.includes('event: notification')) continue;
        const dataLine = frame.split('\n').find((line) => line.startsWith('data: '));
        if (dataLine) {
          clearTimeout(timer);
          resolve(JSON.parse(dataLine.slice(6)));
          return;
        }
      }
    }
    })().catch((error) => { clearTimeout(timer); reject(error); });
  });
}

async function waitForCondition(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error('Timed out waiting for the expected SMTP email.');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function cleanup() {
  if (userIds.length) {
    await prisma.jobReferral.deleteMany({ where: { OR: [{ studentId: { in: userIds } }, { alumniId: { in: userIds } }] } });
    await prisma.mentorshipRequest.deleteMany({ where: { studentId: { in: userIds } } });
    await prisma.event.deleteMany({ where: { organizerId: { in: userIds } } });
    await prisma.mentorshipSlot.deleteMany({ where: { alumniId: { in: userIds } } });
    await prisma.jobPost.deleteMany({ where: { postedById: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

async function run() {
  await connectDB();
  const emailMessages = [];
  const smtpServer = new SMTPServer({
    authOptional: true,
    disabledCommands: ['AUTH', 'STARTTLS'],
    onData(stream, _session, callback) {
      let message = '';
      stream.on('data', (chunk) => { message += chunk.toString(); });
      stream.on('end', () => { emailMessages.push(message); callback(null, 'Message accepted by integration test SMTP server.'); });
      stream.resume();
    },
  });
  await new Promise((resolve, reject) => {
    smtpServer.once('error', reject);
    smtpServer.listen(0, '127.0.0.1', resolve);
  });
  config.email.host = '127.0.0.1';
  config.email.port = smtpServer.server.address().port;
  config.email.secure = false;
  config.email.user = '';
  config.email.password = '';
  config.email.from = 'notifications@alumniconnect.test';
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base.value = `http://127.0.0.1:${server.address().port}`;
  let streamReader;

  try {
    const student = await register('Integration Student', 'STUDENT');
    const secondStudent = await register('Integration Student Two', 'STUDENT');
    const alumni = await register('Integration Alumni', 'ALUMNI');
    const admin = await prisma.user.create({ data: {
      name: 'Integration Administrator',
      email: `admin.${stamp}@integration.alumniconnect.test`,
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(userPassword, 10),
      profile: { create: {} },
    } });
    userIds.push(admin.id);
    const adminToken = await login(admin.email);

    const health = await call('GET', '/api/health');
    check('health endpoint', health, [200]);
    const cors = await fetch(`${base.value}/api/health`, { method: 'OPTIONS', headers: { Origin: process.env.CLIENT_URL || 'http://localhost:5173', 'Access-Control-Request-Method': 'GET' } });
    checks.push({ name: 'credentialed frontend CORS', status: cors.status, pass: cors.headers.get('access-control-allow-credentials') === 'true' });
    if (checks.at(-1).pass !== true) throw new Error('CORS did not allow credentialed frontend requests.');

    for (const [user, profile] of [[student, { branch: 'CSE', industry: 'SaaS', careerGoals: 'SaaS backend engineering' }], [alumni, { branch: 'CSE', industry: 'SaaS', company: 'Integration Cloud', designation: 'Engineer' }]]) {
      check('profile update', await call('PUT', '/api/users/me', user.token, profile), [200]);
    }
    for (const [user, skill] of [[student, 'React'], [student, 'Node.js'], [alumni, 'React'], [alumni, 'Node.js']]) {
      check('add profile skill', await call('POST', '/api/users/me/skills', user.token, { name: skill }), [201]);
    }
    const publicProfile = await call('GET', `/api/users/${alumni.id}`);
    check('public profile privacy', publicProfile, [200]);
    if ('email' in publicProfile.data.data.user) throw new Error('Public profile unexpectedly contains an email address.');

    const job = await call('POST', '/api/jobs', alumni.token, {
      title: 'Integration React Engineer', description: 'Build React and Node.js services for a SaaS platform.',
      company: 'Integration Cloud', location: 'Remote', employmentType: 'FULL_TIME', experienceLevel: 'ENTRY',
    });
    check('create job', job, [201]);
    const jobId = job.data.data.job.id;
    const jobFilter = await call('GET', '/api/jobs?location=Remote&skill=React', student.token);
    check('job location and skill filters', jobFilter, [200]);
    if (!jobFilter.data.data.jobs.some((item) => item.id === jobId)) throw new Error('Job filters did not return the matching listing.');

    const sseResponse = await fetch(`${base.value}/api/notifications/stream`, { headers: { cookie: alumni.cookie, origin: process.env.CLIENT_URL || 'http://localhost:5173' } });
    check('authenticated real-time notification stream', { status: sseResponse.status }, [200]);
    if (sseResponse.headers.get('access-control-allow-credentials') !== 'true') throw new Error('Notification stream does not allow credentialed browser connections.');
    streamReader = sseResponse.body.getReader();
    const ssePromise = waitForNotification(streamReader);
    const referral = await call('POST', `/api/jobs/${jobId}/referrals`, student.token, { message: 'Please consider me for this role.' });
    check('request referral', referral, [201]);
    await waitForCondition(() => emailMessages.some((message) => message.includes('Subject: New referral request')));
    checks.push({ name: 'SMTP referral email delivery', status: 250, pass: true });
    const referralSse = await ssePromise;
    if (referralSse.type !== 'REFERRAL_RECEIVED') throw new Error('SSE delivered the wrong notification type.');
    checks.push({ name: 'real-time referral notification', status: 200, pass: true });
    check('duplicate referral blocked', await call('POST', `/api/jobs/${jobId}/referrals`, student.token, {}), [409]);
    check('alumni receives referral', await call('GET', '/api/referrals/alumni', alumni.token), [200]);
    const alumniNotifications = await call('GET', '/api/notifications', alumni.token);
    check('persisted notification inbox', alumniNotifications, [200]);
    const referralNotification = alumniNotifications.data.data.notifications.find((item) => item.type === 'REFERRAL_RECEIVED');
    if (!referralNotification) throw new Error('Referral notification was not persisted.');
    check('mark notification read', await call('PATCH', `/api/notifications/${referralNotification.id}/read`, alumni.token), [200]);
    check('alumni reviews referral', await call('PATCH', `/api/referrals/${referral.data.data.referral.id}/status`, alumni.token, { status: 'REVIEWED' }), [200]);
    check('accept referral', await call('PATCH', `/api/referrals/${referral.data.data.referral.id}/status`, alumni.token, { status: 'ACCEPTED' }), [200]);
    check('terminal referral transition blocked', await call('PATCH', `/api/referrals/${referral.data.data.referral.id}/status`, alumni.token, { status: 'REJECTED' }), [400]);
    const studentNotices = await call('GET', '/api/notifications', student.token);
    check('student receives referral status notification', studentNotices, [200]);
    if (!studentNotices.data.data.notifications.some((item) => item.type === 'REFERRAL_STATUS')) throw new Error('Referral status notification missing.');
    check('mark all notifications read', await call('PATCH', '/api/notifications/read-all', student.token), [200]);
    check('notification ownership isolation', await call('PATCH', `/api/notifications/${referralNotification.id}/read`, student.token), [404]);

    const matches = await call('GET', '/api/network/matches', student.token);
    check('alumni matching', matches, [200]);
    if (!matches.data.data.some((item) => item.matchScore > 0)) throw new Error('Matching returned no relevant alumni.');
    const recommendations = await call('GET', '/api/jobs/recommendations', student.token);
    check('job recommendations', recommendations, [200]);
    if (!recommendations.data.data.some((item) => item.matchScore > 0)) throw new Error('Matching returned no relevant job.');

    const slot = await call('POST', '/api/mentorship/slots', alumni.token, {
      topic: 'Integration career mentoring', expertise: 'React and Node.js',
      startTime: future(1, 120), endTime: future(1, 180),
    });
    check('create mentorship slot', slot, [201]);
    const slotId = slot.data.data.slot.id;
    check('student cannot publish a mentor slot', await call('POST', '/api/mentorship/slots', student.token, { topic: 'Unauthorized slot', startTime: future(5), endTime: future(5, 60) }), [403]);
    const mentorSearch = await call('GET', '/api/mentorship/slots?skill=React', student.token);
    check('search mentors by skill', mentorSearch, [200]);
    if (!mentorSearch.data.data.slots.some((item) => item.id === slotId)) throw new Error('Mentorship skill filter omitted the matching slot.');
    const mentorship = await call('POST', '/api/mentorship/requests', student.token, { slotId, message: 'I would like career guidance.' });
    check('request mentorship', mentorship, [201]);
    check('duplicate mentorship request blocked', await call('POST', '/api/mentorship/requests', student.token, { slotId }), [409]);
    check('alumni receives mentorship request', await call('GET', '/api/mentorship/requests/received', alumni.token), [200]);
    check('accept mentorship request', await call('PATCH', `/api/mentorship/requests/${mentorship.data.data.request.id}/status`, alumni.token, { status: 'ACCEPTED' }), [200]);
    check('prevent overlapping mentor availability', await call('POST', '/api/mentorship/slots', alumni.token, { topic: 'Overlapping mentor slot', startTime: future(1, 120), endTime: future(1, 180) }), [409]);
    check('accepted mentorship request cannot be cancelled', await call('PATCH', `/api/mentorship/requests/${mentorship.data.data.request.id}/status`, student.token, { status: 'CANCELLED' }), [400]);
    const mentorshipNotices = await call('GET', '/api/notifications', student.token);
    if (!mentorshipNotices.data.data.notifications.some((item) => item.type === 'MENTORSHIP_STATUS')) throw new Error('Mentorship status notification missing.');
    checks.push({ name: 'mentorship status notification', status: 200, pass: true });
    const pendingSlot = await call('POST', '/api/mentorship/slots', alumni.token, { topic: 'Pending request cancellation', startTime: future(2, 120), endTime: future(2, 180) });
    check('create slot for cancellation test', pendingSlot, [201]);
    const pendingRequest = await call('POST', '/api/mentorship/requests', secondStudent.token, { slotId: pendingSlot.data.data.slot.id });
    check('create pending mentorship request', pendingRequest, [201]);
    check('student cancels pending request', await call('PATCH', `/api/mentorship/requests/${pendingRequest.data.data.request.id}/status`, secondStudent.token, { status: 'CANCELLED' }), [200]);
    const rejectSlot = await call('POST', '/api/mentorship/slots', alumni.token, { topic: 'Rejected request test', startTime: future(3, 120), endTime: future(3, 180) });
    check('create slot for rejection test', rejectSlot, [201]);
    const rejectedRequest = await call('POST', '/api/mentorship/requests', secondStudent.token, { slotId: rejectSlot.data.data.slot.id });
    check('create request to reject', rejectedRequest, [201]);
    check('alumni rejects mentorship request', await call('PATCH', `/api/mentorship/requests/${rejectedRequest.data.data.request.id}/status`, alumni.token, { status: 'REJECTED' }), [200]);
    check('student receives rejected request status', await call('GET', '/api/notifications', secondStudent.token), [200]);
    if (!(await prisma.notification.findFirst({ where: { userId: secondStudent.id, type: 'MENTORSHIP_STATUS' } }))) throw new Error('Cancellation/rejection notification missing.');

    const eventStart = future(4);
    const eventEnd = new Date(new Date(eventStart).getTime() + 3600000).toISOString();
    const event = await call('POST', '/api/events', alumni.token, {
      title: 'Integration capacity workshop', description: 'Integration event for capacity and notification checks.',
      category: 'WORKSHOP', location: 'Online', eventType: 'VIRTUAL', startDate: eventStart,
      endDate: eventEnd, capacity: 1,
    });
    check('create event', event, [201]);
    const eventId = event.data.data.event.id;
    const eventSearch = await call('GET', '/api/events?search=capacity%20workshop&category=WORKSHOP', student.token);
    check('event text and category filters', eventSearch, [200]);
    const capacityResults = await Promise.all([
      call('POST', `/api/events/${eventId}/register`, student.token),
      call('POST', `/api/events/${eventId}/register`, secondStudent.token),
    ]);
    checks.push({ name: 'concurrent capacity enforcement', status: capacityResults.map((item) => item.status).join('/'), pass: capacityResults.filter((item) => item.status === 201).length === 1 && capacityResults.filter((item) => item.status === 409).length === 1 });
    if (checks.at(-1).pass !== true) throw new Error('Concurrent event registrations did not produce one success and one conflict.');
    check('organizer views event participants', await call('GET', `/api/events/${eventId}/participants`, alumni.token), [200]);
    const attendeeToken = capacityResults[0].status === 201 ? student.token : secondStudent.token;
    const attendeeId = attendeeToken === student.token ? student.id : secondStudent.id;
    check('organizer updates event', await call('PUT', `/api/events/${eventId}`, alumni.token, { description: 'Updated integration event description for notification delivery.' }), [200]);
    if (!(await prisma.notification.findFirst({ where: { userId: attendeeId, type: 'EVENT_UPDATE' } }))) throw new Error('Registered attendee did not receive event update notification.');
    check('attendee cancels event registration', await call('DELETE', `/api/events/${eventId}/register`, attendeeToken), [200]);
    check('organizer receives cancellation notification', await call('GET', '/api/notifications', alumni.token), [200]);
    if (!(await prisma.notification.findFirst({ where: { userId: alumni.id, type: 'EVENT_REGISTRATION' } }))) throw new Error('Event registration notification missing.');
    check('admin removes event', await call('DELETE', `/api/events/${eventId}`, adminToken), [200]);

    const closedStart = future(5);
    const closedEnd = new Date(new Date(closedStart).getTime() + 3600000).toISOString();
    const closedEvent = await call('POST', '/api/events', alumni.token, {
      title: 'Closed registration test', description: 'Registration deadline has already passed.', category: 'TALK',
      location: 'Online', eventType: 'VIRTUAL', startDate: closedStart, endDate: closedEnd,
      registrationDeadline: new Date(Date.now() - 60000).toISOString(), capacity: 5,
    });
    check('create event with elapsed deadline', closedEvent, [201]);
    check('elapsed event registration deadline enforced', await call('POST', `/api/events/${closedEvent.data.data.event.id}/register`, student.token), [400]);

    check('admin statistics', await call('GET', '/api/admin/stats', adminToken), [200]);
    check('admin user pagination', await call('GET', '/api/admin/users?page=1&limit=2', adminToken), [200]);
    check('admin user detail', await call('GET', `/api/admin/users/${student.id}`, adminToken), [200]);
    check('admin deactivates user', await call('PATCH', `/api/admin/users/${secondStudent.id}/status`, adminToken, { isActive: false }), [200]);
    check('inactive account cannot log in', await call('POST', '/api/auth/login', null, { email: secondStudent.email, password: userPassword }), [401]);
    check('admin reactivates user', await call('PATCH', `/api/admin/users/${secondStudent.id}/status`, adminToken, { isActive: true }), [200]);
    check('student cannot view admin data', await call('GET', '/api/admin/stats', student.token), [403]);
    check('unauthenticated access denied', await call('GET', '/api/admin/stats'), [401]);
    check('public admin registration denied', await call('POST', '/api/auth/register', null, { name: 'Fake Admin', email: `fake.${stamp}@integration.alumniconnect.test`, password: userPassword, role: 'ADMIN' }), [400]);

    console.log(`Integration smoke checks passed: ${checks.filter((item) => item.pass).length}/${checks.length}`);
    for (const item of checks) console.log(`PASS ${item.name}`);
  } finally {
    await streamReader?.cancel().catch(() => {});
    await new Promise((resolve) => server.close(resolve));
    await notificationService.flushEmailDeliveries();
    await new Promise((resolve) => smtpServer.close(resolve));
    await cleanup();
    await disconnectDB();
  }
}

run().catch((error) => {
  console.error(`Integration smoke test failed: ${error.message}`);
  if (checks.length) console.error(`Checks passed before failure: ${checks.filter((item) => item.pass).length}/${checks.length}`);
  process.exitCode = 1;
});
