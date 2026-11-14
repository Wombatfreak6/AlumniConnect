# AlumniConnect API Reference

Base URL for local development: `http://localhost:5001/api`. Protected endpoints accept the JWT HttpOnly cookie set by login (or a bearer token where supported). Unless marked public, authentication is required. Request and response bodies use JSON.

## Foundation and administration

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API health response |
| POST | `/auth/register` | Public (STUDENT/ALUMNI only) | Register account |
| POST | `/auth/login` | Public | Start session |
| POST | `/auth/logout` | Public | Clear session cookie |
| GET | `/auth/me` | Authenticated | Read current session user |
| GET | `/auth/admin/verify` | ADMIN | Verify admin access |
| GET | `/users/me` | Authenticated | Read own profile and skills |
| PUT | `/users/me` | Authenticated | Update own name/profile |
| POST | `/users/me/skills` | Authenticated | Add skill |
| DELETE | `/users/me/skills/:skillId` | Authenticated | Remove own skill |
| GET | `/users/:id` | Public | Read sanitized public profile for an active user |
| GET | `/skills` | Public | List skill catalog |
| GET | `/admin/users?page=&limit=&role=&isActive=&search=` | ADMIN | Search/paginate user directory |
| GET | `/admin/users/:id` | ADMIN | Read user details and counts |
| PATCH | `/admin/users/:id/status` | ADMIN | Activate/deactivate eligible account |
| GET | `/admin/stats` | ADMIN | Live account, jobs, mentorship and event totals |

## Jobs, referrals and recommendations

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/jobs?page=&limit=&search=&company=&location=&skill=&employmentType=&experienceLevel=` | Authenticated | Search/filter/paginate jobs |
| POST | `/jobs` | ALUMNI | Create a job post |
| GET | `/jobs/my` | ALUMNI | List own job posts |
| GET | `/jobs/:id` | Authenticated | Read job details |
| PUT | `/jobs/:id` | Owner ALUMNI or ADMIN | Update job |
| DELETE | `/jobs/:id` | Owner ALUMNI or ADMIN | Delete job and dependent referrals per schema |
| POST | `/jobs/:id/referrals` | STUDENT | Request a referral |
| GET | `/referrals/student` | STUDENT | List sent referral requests |
| GET | `/referrals/alumni` | ALUMNI | List requests for alumni's jobs |
| PATCH | `/referrals/:id/status` | Owning ALUMNI | Set referral status |
| GET | `/jobs/recommendations?limit=&minScore=` | STUDENT | Rank job matches |
| GET | `/network/jobs/recommendations?limit=&minScore=` | STUDENT | Alias for job recommendations |
| GET | `/network/matches?limit=&minScore=` | STUDENT | Rank alumni matches |

Job list filters include location and skill in addition to search, company, employment type and experience level. Matching score weights are skills 50, branch 30, and industry/career relevance 20, with scores rounded to the nearest integer.

## Notifications

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/notifications?limit=` | Authenticated | Read own notification inbox and unread count |
| GET | `/notifications/stream` | Authenticated cookie session | Receive real-time Server-Sent Events |
| PATCH | `/notifications/:id/read` | Owner | Mark one notification read |
| PATCH | `/notifications/read-all` | Authenticated | Mark all of own notifications read |

Notifications are generated for referral requests/status changes, mentorship requests/status changes, and event registrations, cancellations, and updates. Email delivery is optional and uses SMTP settings from the server environment.

## Mentorship

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/mentorship/slots?skill=&expertise=` | Authenticated | Browse available future slots |
| GET | `/mentorship/slots/my` | ALUMNI | List own upcoming slots |
| GET | `/mentorship/slots/:id` | Authenticated | View available slot and public mentor details |
| POST | `/mentorship/slots` | ALUMNI | Create available slot |
| PUT | `/mentorship/slots/:id` | Owner ALUMNI or ADMIN | Update unbooked slot |
| DELETE | `/mentorship/slots/:id` | Owner ALUMNI or ADMIN | Cancel slot |
| POST | `/mentorship/requests` | STUDENT | Request slot with optional message |
| GET | `/mentorship/requests/sent` | STUDENT | List sent requests |
| GET | `/mentorship/requests/received` | ALUMNI or ADMIN | List incoming requests |
| PATCH | `/mentorship/requests/:id/status` | Requesting STUDENT, slot-owner ALUMNI or ADMIN | Cancel pending, or accept/reject pending request |

## Events

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/events?search=&category=` | Authenticated | Search future events by text/category |
| POST | `/events` | ALUMNI or ADMIN | Create event |
| GET | `/events/my-events` | Authenticated | List own active registrations |
| GET | `/events/:id` | Authenticated | Read event and own registration state |
| PUT | `/events/:id` | Organizer or ADMIN | Edit event |
| DELETE | `/events/:id` | Organizer or ADMIN | Delete event |
| POST | `/events/:id/register` | STUDENT or ALUMNI | Register subject to deadline and capacity |
| DELETE | `/events/:id/register` | STUDENT or ALUMNI | Cancel before event starts |
| GET | `/events/:id/participants` | Organizer or ADMIN | List registered participants |

## Response and error conventions

Most routes return `{ success, message, data }`; validation errors use 400, missing records 404, unauthorized roles/ownership 403, duplicate/conflict operations 409, and unauthenticated calls 401. Unexpected server errors are logged server-side and return a generic message.
