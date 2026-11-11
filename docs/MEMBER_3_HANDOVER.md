# AlumniConnect — Mentorship and Events Handover

**Phase:** Mentorship and Events integration  
**Date:** 2026-11-10  
**Working branch:** `feature/mentorship-events-integration` (created from `feature/ALUMNICONNECT`)

## What changed

- Added authenticated mentorship endpoints in `server/src/modules/mentorship/` using the existing `MentorshipSlot`, `MentorshipRequest`, and enums.
- Added authenticated event endpoints in `server/src/modules/events/` using the existing `Event`, `EventRegistration`, and enums.
- Added `GET /api/admin/stats` for live user, job, mentorship request, and event counts; the existing admin dashboard now uses database counts instead of a hard-coded connected status.
- Registered both routers in `server/src/app.js`.
- Added `communityService.js`, responsive community pages and protected React routes for mentor search, availability, requests, event browsing, details, registration, organizer editing, and participant lists.
- Integrated mentorship and event navigation with the existing role dashboards and design tokens.
- Added persisted notifications, a per-user Server-Sent Events stream, notification inbox controls, and optional SMTP email delivery. Notification migration: `20261111132645_add_notifications`.

## API endpoints

Endpoints marked for signed-in users require the existing JWT cookie or bearer token; public endpoints are identified in the combined API inventory.

### Mentorship

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/mentorship/slots?skill=&expertise=` | Any signed-in user | Browse future available slots |
| GET | `/api/mentorship/slots/my` | ALUMNI | List own future slots |
| GET | `/api/mentorship/slots/:id` | Any signed-in user | View slot and sanitized mentor details |
| POST | `/api/mentorship/slots` | ALUMNI | Create a future slot |
| PUT | `/api/mentorship/slots/:id` | Owner ALUMNI or ADMIN | Update an unbooked slot |
| DELETE | `/api/mentorship/slots/:id` | Owner ALUMNI or ADMIN | Cancel a slot |
| POST | `/api/mentorship/requests` | STUDENT | Request a slot (`slotId`, optional `message`) |
| GET | `/api/mentorship/requests/sent` | STUDENT | View sent requests |
| GET | `/api/mentorship/requests/received` | ALUMNI or ADMIN | View incoming requests |
| PATCH | `/api/mentorship/requests/:id/status` | Requesting STUDENT, slot owner ALUMNI, or ADMIN | Cancel as student, accept/reject as slot owner |

### Notifications

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/notifications` | Any signed-in user | List own notifications and unread count |
| GET | `/api/notifications/stream` | Authenticated cookie session | Receive real-time notification events |
| PATCH | `/api/notifications/:id/read` | Owner | Mark one notification read |
| PATCH | `/api/notifications/read-all` | Any signed-in user | Mark all own notifications read |

SMTP email is optional. Configure the `SMTP_*` variables in `server/.env`; without SMTP, in-app delivery still works.

### Administration

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/admin/stats` | ADMIN | Return live totals for users, students, alumni, job posts, mentorship requests, and events |

Slot request uniqueness is enforced by the existing database constraint. A slot is claimed with a conditional update when accepted so two requests cannot both book it. Alumni slot time overlap is checked on create and update.

### Events

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/events?search=&category=` | Any signed-in user | Browse future events |
| POST | `/api/events` | ALUMNI or ADMIN | Create an event |
| GET | `/api/events/my-events` | Any signed-in user | List active registrations |
| GET | `/api/events/:id` | Any signed-in user | Get event details and own registration state |
| PUT | `/api/events/:id` | Organizer or ADMIN | Edit event |
| DELETE | `/api/events/:id` | Organizer or ADMIN | Delete event |
| POST | `/api/events/:id/register` | STUDENT or ALUMNI | Register, subject to deadline and capacity |
| DELETE | `/api/events/:id/register` | STUDENT or ALUMNI | Cancel before event starts |
| GET | `/api/events/:id/participants` | Organizer or ADMIN | List registered participants |

Duplicate registrations are rejected; cancelled users can register again. The database unique key is reused. Capacity is checked in a serializable transaction. Event creation and updates validate category, format, dates, deadline, and capacity.

## Frontend routes

- `/mentorship` — browse mentors and request a slot
- `/mentorship/manage` — alumni slot publishing and request management
- `/mentorship/requests` — student sent requests
- `/events` — search and browse
- `/events/:id` — details, registration, organizer actions, participants
- `/events/create`, `/events/:id/edit` — organizer forms
- `/events/my` — current user's registered events

## Verification performed

- `node --check` passed for the new backend service/controller files and `server/src/app.js`.
- `git diff --check` passed.
- `client`: `npm run lint` passed with no warnings; `npm run build` passed.
- `server`: `npx prisma validate` passed; `node --check` passed for new backend modules and `server/src/app.js`.
- `git diff --check` passed.
- The repeatable integration smoke suite runs against `TEST_DATABASE_URL`, which must point to a dedicated database ending in `_test`; it verifies 67 API, authorization, real-time notification, local SMTP delivery, and concurrency checks. Configure SMTP credentials separately to deliver to real email inboxes.

## Remaining handover items

- Member 1 foundation notes and the combined API inventory are in `docs/MEMBER_1_HANDOVER.md` and `docs/API_REFERENCE.md`.
- The feature branch was pushed; a pull request was not opened because the connected GitHub integration returned 403 and the browser origin approval was declined. Create the PR from the compare page after access is available.
- Admin dashboard includes separate live counts for students, alumni, users, job posts, mentorship requests, and events, plus paginated user management and recent job moderation. Events are managed from the event browse/detail pages; admins can edit/delete any event.
