# AlumniConnect — Member 2 Handover Document

**Document Version:** 2.0.0
**Scope:** Member 2 — Job Board, Referral Engine & Intelligent Matching
**Author:** Member 2
**Target Recipient:** Member 3 (Mentorship, Events & Notifications Developer)
**Historical Member 2 branch:** `feature/member-2-final`
**Current integrated checkout:** `feature/mentorship-events-integration`
**History note:** This handover describes the Member 2 implementation; use `git log` for verified commit history.
**Date Completed:** 2026-11-10

---

## Table of Contents

1. [Architecture Preserved](#1-architecture-preserved)
2. [Files Created](#2-files-created)
3. [Files Modified](#3-files-modified)
4. [APIs Implemented](#4-apis-implemented)
5. [Request / Response Examples](#5-request--response-examples)
6. [Database Models Reused](#6-database-models-reused)
7. [Schema Changes](#7-schema-changes)
8. [Referral Lifecycle](#8-referral-lifecycle)
9. [Matching Algorithm & Scoring Formula](#9-matching-algorithm--scoring-formula)
10. [Frontend Routes](#10-frontend-routes)
11. [Authentication Integration](#11-authentication-integration)
12. [Verification Status](#12-verification-status)

---

## 1. Architecture Preserved

Member 2 made **zero breaking changes** to the architecture established by Member 1. All design principles, conventions, and patterns have been strictly followed.

### Backend Architecture
- **Framework:** Express.js with modular route/controller/service separation
- **Database ORM:** Prisma 7 with PostgreSQL 16+
- **Auth:** `httpOnly` cookie-based sessions; middleware populates `req.user` with the full `User` record from the database
- **Module structure:** Each domain lives under `server/src/modules/<domain>/` with four files:
  - `<domain>.routes.js` — Express router; mounts middleware + controller
  - `<domain>.controller.js` — HTTP layer (parse request, call service, respond)
  - `<domain>.service.js` — Business logic and Prisma queries
  - `<domain>.validation.js` — `express-validator` rules used in routes
- **Error handling:** Errors propagate from service → controller; controllers catch and respond with appropriate HTTP status codes
- **Environment:** All secrets in `server/.env`; never committed (confirmed in `.gitignore`)

### Frontend Architecture
- **Framework:** React 19 with Vite
- **Routing:** React Router v7 with `<ProtectedRoute>` for auth guarding and role-based access
- **State:** React Context API (`AuthContext`) for authentication state; local `useState`/`useEffect` for page-level state
- **HTTP:** `jobService.js` wraps `fetch` with `credentials: 'include'` to send cookies
- **Styling:** Pure CSS with CSS custom properties (design tokens); no additional CSS framework introduced
- **Layout:** All new pages render inside `<DashboardLayout>` identical to existing pages

### Design Tokens Respected
All new CSS files use the existing token set:
```
--color-primary, --color-primary-dark, --color-secondary
--color-background, --color-surface, --color-border
--color-text-primary, --color-text-secondary, --color-text-muted
--border-radius-*, --shadow-*, --spacing-*
```

---

## 2. Files Created

### Backend — New Files

| File | Purpose |
|------|---------|
| `server/src/modules/jobs/jobs.routes.js` | Express router for all `/api/jobs` endpoints |
| `server/src/modules/jobs/jobs.controller.js` | HTTP handlers for job CRUD + referral submission |
| `server/src/modules/jobs/jobs.service.js` | Business logic: create, read, update, delete jobs; submit referral; get recommendations |
| `server/src/modules/jobs/jobs.validation.js` | `express-validator` rules for job create/update |
| `server/src/modules/referrals/referrals.routes.js` | Express router for `/api/alumni/referrals`, `/api/student/referrals`, `/api/referrals/:id/status` |
| `server/src/modules/referrals/referrals.controller.js` | HTTP handlers for referral inbox and status transitions |
| `server/src/modules/referrals/referrals.service.js` | Business logic: referral queries, status machine enforcement |
| `server/src/modules/referrals/referrals.validation.js` | Validation rules for status update payload |
| `server/src/modules/network/matching.constants.js` | Branch alias map and industry keyword dictionary |
| `server/src/modules/network/matching.service.js` | 3-factor scoring engine (skills + branch + industry) |
| `server/src/modules/network/network.controller.js` | HTTP handlers for alumni matches and job recommendations |
| `server/src/modules/network/network.routes.js` | Express router for `/api/network/matches` and `/api/jobs/recommendations` |

### Frontend — New Files

| File | Purpose |
|------|---------|
| `client/src/services/jobService.js` | All frontend API calls for jobs, referrals, and network endpoints |
| `client/src/pages/jobs/JobBoardPage.jsx` | Browse all jobs with search, filter, and pagination |
| `client/src/pages/jobs/JobDetailsPage.jsx` | Full job detail view; referral button for students; edit/delete for alumni owners |
| `client/src/pages/jobs/CreateJobPage.jsx` | Form to create a new job posting (ALUMNI only) |
| `client/src/pages/jobs/EditJobPage.jsx` | Pre-filled form to edit an existing job (ALUMNI owner only) |
| `client/src/pages/jobs/MyJobsPage.jsx` | Alumnus's own job listings with view/edit/delete actions |
| `client/src/pages/jobs/Jobs.css` | Styles for all five job pages |
| `client/src/pages/referrals/StudentReferralsPage.jsx` | Student referral history with status badges |
| `client/src/pages/referrals/AlumniReferralsPage.jsx` | Alumni inbox: view requests, change status (REVIEWED/ACCEPTED/REJECTED) |
| `client/src/pages/referrals/Referrals.css` | Styles for referral pages |
| `client/src/pages/network/RecommendationsPage.jsx` | Student recommendations: matched alumni cards + recommended jobs section |
| `client/src/pages/network/Recommendations.css` | Styles for the recommendations page |

---

## 3. Files Modified

| File | What Changed |
|------|-------------|
| `server/src/app.js` | Registered three new route modules: `jobsRouter`, `referralsRouter`, `networkRouter` |
| `client/src/App.jsx` | Added eight new `<Route>` entries for jobs, referrals, and network pages; wrapped with `<ProtectedRoute role={...}>` |
| `client/src/layouts/DashboardLayout.jsx` | Added sidebar nav links: **Job Board**, **My Jobs** (ALUMNI), **Post a Job** (ALUMNI), **My Referrals** (STUDENT), **Referral Requests** (ALUMNI), **My Network** (STUDENT) |
| `client/src/pages/student/StudentDashboard.jsx` | Added live module cards for Job Board, My Referrals, and My Network |
| `client/src/pages/alumni/AlumniDashboard.jsx` | Added quick-action buttons for Post Job, My Jobs, and Referral Requests |

---

## 4. APIs Implemented

### Job Management

| Method | Route | Auth Required | Role |
|--------|-------|---------------|------|
| `POST` | `/api/jobs` | ✅ | ALUMNI |
| `GET` | `/api/jobs` | ✅ | Any authenticated |
| `GET` | `/api/jobs/my` | ✅ | ALUMNI |
| `GET` | `/api/jobs/:id` | ✅ | Any authenticated |
| `PUT` | `/api/jobs/:id` | ✅ | ALUMNI (owner) or ADMIN |
| `DELETE` | `/api/jobs/:id` | ✅ | ALUMNI (owner) or ADMIN |

**Query Parameters for `GET /api/jobs`:**
- `search` — partial match on title or company (case-insensitive)
- `location` — exact city/location filter
- `employmentType` — `FULL_TIME | PART_TIME | INTERNSHIP | CONTRACT | FREELANCE`
- `experienceLevel` — `ENTRY | MID | SENIOR | LEAD | EXECUTIVE`
- `page` — page number (default: 1)
- `limit` — items per page (default: 10, max: 50)

### Referral Engine

| Method | Route | Auth Required | Role |
|--------|-------|---------------|------|
| `POST` | `/api/jobs/:id/referrals` | ✅ | STUDENT |
| `GET` | `/api/student/referrals` | ✅ | STUDENT |
| `GET` | `/api/alumni/referrals` | ✅ | ALUMNI |
| `PATCH` | `/api/referrals/:id/status` | ✅ | ALUMNI (assigned to job) |

### Intelligent Matching / Network

| Method | Route | Auth Required | Role |
|--------|-------|---------------|------|
| `GET` | `/api/network/matches` | ✅ | STUDENT |
| `GET` | `/api/jobs/recommendations` | ✅ | STUDENT |

---

## 5. Request / Response Examples

### Create a Job (`POST /api/jobs`)

**Request:**
```json
{
  "title": "Backend Engineer",
  "description": "We are looking for an experienced backend engineer to join our platform team. You will be responsible for designing and implementing scalable APIs using Node.js and PostgreSQL.",
  "company": "TechCorp",
  "location": "Bangalore",
  "employmentType": "FULL_TIME",
  "experienceLevel": "MID",
  "applicationUrl": "https://techcorp.io/careers/backend",
  "deadline": "2026-12-31T23:59:59.000Z"
}
```

**Response `201 Created`:**
```json
{
  "id": 42,
  "title": "Backend Engineer",
  "company": "TechCorp",
  "location": "Bangalore",
  "employmentType": "FULL_TIME",
  "experienceLevel": "MID",
  "applicationUrl": "https://techcorp.io/careers/backend",
  "deadline": "2026-12-31T23:59:59.000Z",
  "createdAt": "2026-11-10T11:30:00.000Z",
  "alumnus": {
    "id": 7,
    "name": "Rahul Sharma",
    "email": "rahul@example.com"
  }
}
```

### Submit a Referral Request (`POST /api/jobs/:id/referrals`)

**Request:**
```json
{
  "message": "Hi, I'm very interested in this role. I have 2 years of Node.js experience and would love a referral."
}
```

**Response `201 Created`:**
```json
{
  "id": 11,
  "status": "PENDING",
  "message": "Hi, I'm very interested...",
  "createdAt": "2026-11-10T12:00:00.000Z",
  "job": {
    "id": 42,
    "title": "Backend Engineer",
    "company": "TechCorp"
  },
  "alumnus": {
    "id": 7,
    "name": "Rahul Sharma"
  }
}
```

**Duplicate request `409 Conflict`:**
```json
{ "error": "You have already submitted a referral request for this job." }
```

### Update Referral Status (`PATCH /api/referrals/:id/status`)

**Request:**
```json
{ "status": "ACCEPTED" }
```

**Response `200 OK`:**
```json
{
  "id": 11,
  "status": "ACCEPTED",
  "updatedAt": "2026-11-10T13:00:00.000Z"
}
```

**Invalid transition `400 Bad Request`:**
```json
{ "error": "Cannot transition from ACCEPTED to PENDING." }
```

### Get Alumni Recommendations (`GET /api/network/matches`)

**Response `200 OK`:**
```json
{
  "matches": [
    {
      "id": 7,
      "name": "Rahul Sharma",
      "email": "rahul@example.com",
      "score": 85,
      "matchedSkills": ["Python", "PostgreSQL"],
      "reason": "Strong skill and academic branch alignment.",
      "breakdown": {
        "skillScore": 50,
        "branchScore": 25,
        "industryScore": 10
      },
      "profile": {
        "bio": "Senior engineer at TechCorp",
        "company": "TechCorp",
        "branch": "CSE",
        "college": "IIT Delhi",
        "linkedinUrl": "https://linkedin.com/in/rahulsharma"
      },
      "skills": ["Python", "PostgreSQL", "Node.js", "Docker"]
    }
  ]
}
```

### Get Job Recommendations (`GET /api/jobs/recommendations`)

**Response `200 OK`:**
```json
{
  "recommendations": [
    {
      "id": 42,
      "title": "Backend Engineer",
      "company": "TechCorp",
      "location": "Bangalore",
      "employmentType": "FULL_TIME",
      "experienceLevel": "MID",
      "score": 78,
      "matchedSkills": ["Python", "Node.js"],
      "reason": "Strong skill match with your profile."
    }
  ]
}
```

---

## 6. Database Models Reused

Member 2 used **only existing Prisma models** — no new migrations were required.

| Model | Used For |
|-------|---------|
| `User` | Authentication context; job poster (`alumnus`); referral participants |
| `Profile` | Display alumni info (bio, company, branch, college, linkedinUrl) in recommendations and referral cards |
| `Skill` | Master skill catalog for matching |
| `UserSkill` | Per-user skill associations; source of truth for matching engine input |
| `JobPost` | Core job board entity — CRUD, search, filter, pagination |
| `JobReferral` | Student-to-job referral requests with status tracking |

**Prisma relations used:**

```
User          → JobPost        (1:N via alumnusId)
User          → JobReferral    (N:M via studentId / job.alumnusId)
JobPost       → JobReferral    (1:N via jobId)
User          → Profile        (1:1)
User          → UserSkill      (1:N)
UserSkill     → Skill          (N:1)
```

---

## 7. Schema Changes

**None.** The Prisma schema (`server/prisma/schema.prisma`) was not modified. No new migrations were run. All models required by Member 2's work (`JobPost`, `JobReferral`) already existed in the schema established by Member 1.

> Member 3 should also be able to implement their work using only the already-defined `MentorshipSlot`, `MentorshipRequest`, `Event`, and `EventRegistration` models without requiring new schema changes — but verify this by checking the existing schema before starting.

---

## 8. Referral Lifecycle

The referral status machine is strictly enforced in `referrals.service.js`. The only valid enum values are those defined in the Prisma schema: **`PENDING`, `REVIEWED`, `ACCEPTED`, `REJECTED`**. The value `COMPLETED` does not exist and must never be introduced.

```
                ┌─────────────┐
                │   PENDING   │  ← Initial state on submission
                └──────┬──────┘
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
      ┌─────────┐  ┌──────────┐  ┌──────────┐
      │REVIEWED │  │ ACCEPTED │  │ REJECTED │
      └────┬────┘  └──────────┘  └──────────┘
           │          (terminal)   (terminal)
     ┌─────┴─────┐
     ▼           ▼
┌──────────┐ ┌──────────┐
│ ACCEPTED │ │ REJECTED │
└──────────┘ └──────────┘
 (terminal)   (terminal)
```

**Rules:**
- Only the **alumnus assigned to the job** can update the referral status (`req.user.id === job.alumnusId`)
- Transitions from `ACCEPTED` or `REJECTED` are blocked (terminal states)
- The student cannot change the status — only view it
- Duplicate submissions return `HTTP 409 Conflict` before creating a second record

---

## 9. Matching Algorithm & Scoring Formula

The matching engine lives in `server/src/modules/network/matching.service.js` and `matching.constants.js`. It is a 3-factor weighted scoring system producing a score in the range **0–100**.

### Score Breakdown

| Factor | Max Points | Description |
|--------|-----------|-------------|
| Skill Overlap | 50 | Fraction of student skills that appear in alumni's skill set |
| Academic Branch | 30 | Whether student's branch matches alumni's branch (with alias normalization) |
| Industry / Career Interest | 20 | Keyword overlap between student's career goals and alumni's context |

### Formula

```
skillScore    = round((matchedSkillCount / totalStudentSkillCount) × 50)
branchScore   = exactBranchMatch(normalizeAlias(studentBranch), normalizeAlias(alumnusBranch)) ? 30 : 0
industryScore = round((matchedKeywordCount / totalStudentKeywordCount) × 20)

totalScore    = skillScore + branchScore + industryScore   // range: 0–100
```

### Branch Alias Normalization (examples from `matching.constants.js`)

```js
{
  'cs':  'CSE', 'cse': 'CSE', 'computer science': 'CSE',
  'ece': 'ECE', 'electronics': 'ECE',
  'mech': 'ME', 'mechanical': 'ME',
  'it': 'IT', 'information technology': 'IT',
  // ... etc
}
```

### Safety Guarantees

- Returns empty arrays gracefully when either party has no skills or no profile
- Never divides by zero (denominator is clamped to `Math.max(1, count)`)
- Scores are **not calculated on the frontend** — the raw score from the backend is displayed directly

---

## 10. Frontend Routes

All routes are registered in `client/src/App.jsx` and wrapped in `<ProtectedRoute>`.

| Route | Component | Allowed Roles |
|-------|-----------|---------------|
| `/jobs` | `JobBoardPage` | STUDENT, ALUMNI, ADMIN |
| `/jobs/create` | `CreateJobPage` | ALUMNI, ADMIN |
| `/jobs/my` | `MyJobsPage` | ALUMNI, ADMIN |
| `/jobs/:id` | `JobDetailsPage` | STUDENT, ALUMNI, ADMIN |
| `/jobs/:id/edit` | `EditJobPage` | ALUMNI, ADMIN |
| `/referrals/my` | `StudentReferralsPage` | STUDENT, ADMIN |
| `/referrals/received` | `AlumniReferralsPage` | ALUMNI, ADMIN |
| `/network/matches` | `RecommendationsPage` | STUDENT, ADMIN |

> **Route ordering note:** `/jobs/create` and `/jobs/my` are registered **before** `/jobs/:id` in `App.jsx` to prevent React Router from treating the string `"create"` or `"my"` as a dynamic `:id` parameter.

---

## 11. Authentication Integration

### How Auth Works (Member 1's implementation — unchanged)

1. On login, the backend sets an `httpOnly` cookie containing a signed session token
2. All subsequent requests include the cookie automatically (browser behavior)
3. `authMiddleware` in Express reads the cookie, verifies it, and attaches the full `User` database record to `req.user`
4. The `AuthContext` in React holds the logged-in user object in memory; it is re-hydrated on page refresh via `GET /api/auth/me`

### How Member 2 Uses Auth

**Backend:**
```js
// In every protected controller:
const userId = req.user.userId || req.user.id;  // handles both middleware patterns
const userRole = req.user.role;
```

The `|| req.user.id` fallback was added because the Phase 1 middleware populates `req.user` as the full Prisma `User` record (which uses `id`), while some newer middleware variants use `userId`. Both are supported.

**Frontend:**
```js
// jobService.js — all requests include credentials
const res = await fetch(`${API_BASE}/api/jobs`, {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
});
```

```jsx
// Protected route with role guard (App.jsx pattern)
<ProtectedRoute allowedRoles={['ALUMNI', 'ADMIN']}>
  <CreateJobPage />
</ProtectedRoute>
```

---

## 12. Verification Status

The historical API test counts in earlier drafts of this handover could not be reproduced in this checkout and are removed. Current repeatable checks are `npm test` in `server/`, and `npm run lint` plus `npm run build` in `client/`. These validate unit behavior and client compilation only. Live API workflows and database authorization remain unverified until a PostgreSQL test database and credentials are configured.
