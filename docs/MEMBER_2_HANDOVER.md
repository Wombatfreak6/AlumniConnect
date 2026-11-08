# AlumniConnect — Member 2 Handover Specification

**Document Version:** 1.0.0  
**Phase Completed:** Phase 1 (Architecture, Database Foundation, Authentication, User & Profile Management, Role Dashboards, Integration QA)  
**Target Recipient:** Member 2 (Job Board, Referral Engine & Intelligent Matching Developer)  
**Repository Branch:** `main`  
**Latest Baseline Commit:** `06e8ce6` (`test: integrate and validate authentication and profiles`)

---

## 1. Executive Summary & Project Context

AlumniConnect is an enterprise-grade university networking platform designed to bridge collegiate talent with alumni professionals. The project architecture is divided across three phases:
- **Member 1 (Completed):** Complete foundational architecture, PostgreSQL database schema with Prisma 7, Express.js backend with JWT/cookie-based RBAC, React 19 frontend foundation, responsive design tokens, profile management with skills catalog, role-based dashboards (`STUDENT`, `ALUMNI`, `ADMIN`), and comprehensive QA validation.
- **Member 2 (Your Role):** Job board module (`JobPost`), student-alumni internal job referral engine (`JobReferral`), referral status tracking, and the intelligent student-job/alumni matching algorithm.
- **Member 3 (Subsequent):** 1-on-1 mentorship slot scheduling (`MentorshipSlot`), mentee request workflow (`MentorshipRequest`), campus events & webinars (`Event`, `EventRegistration`), and platform notification engine.

Everything built in Phase 1 is fully tested, operational, and committed to `main`. **You do not need to modify database migrations or rebuild authentication.** The schema already contains the models and relationships you need.

---

## 2. Technology Stack & Exact Dependency Versions

### Runtime & System
- **Node.js:** `v25.2.1` (tested & compatible with Node.js `v20.x` LTS and `v22.x` LTS)
- **npm:** `v11.6.2`
- **Database:** PostgreSQL `16+` (running on port `5432`)

### Backend Dependencies (`server/package.json`)
```json
{
  "dependencies": {
    "@prisma/adapter-pg": "^7.10.1",
    "@prisma/client": "^7.10.1",
    "bcryptjs": "^3.0.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^18.0.9",
    "express": "^5.3.0",
    "jsonwebtoken": "^9.0.3",
    "pg": "^8.23.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.11",
    "prisma": "^7.10.1"
  }
}
```

### Frontend Dependencies (`client/package.json`)
```json
{
  "dependencies": {
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "react-router-dom": "^7.18.5"
  },
  "devDependencies": {
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "oxlint": "^1.90.0",
    "vite": "^8.3.6"
  }
}
```

---

## 3. Directory Structure & Codebase Map

```text
alumni-connect/
├── docs/
│   └── MEMBER_2_HANDOVER.md        # This comprehensive handover guide
├── client/                          # React 19 + Vite 8 SPA
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── assets/                  # Branding SVGs and icons
│   │   ├── components/
│   │   │   ├── common/              # Button, Card, Input, Select, Textarea, Loading, ErrorAlert, ProtectedRoute
│   │   │   ├── dashboard/           # StatCard, ActivityFeed
│   │   │   └── navigation/          # Navbar, Sidebar, Footer
│   │   ├── context/                 # AuthContext & AuthProvider (manages user session & state)
│   │   ├── hooks/                   # useAuth hook
│   │   ├── layouts/                 # MainLayout (public), DashboardLayout (sidebar + shell), AuthLayout
│   │   ├── pages/
│   │   │   ├── admin/               # AdminDashboard.jsx (user directory, account toggles)
│   │   │   ├── alumni/              # AlumniDashboard.jsx (stats, profile preview, quick actions, placeholders)
│   │   │   ├── auth/                # LoginPage.jsx, RegisterPage.jsx
│   │   │   ├── profile/             # ProfilePage.jsx (view/edit profile, live skills add/remove)
│   │   │   ├── student/             # StudentDashboard.jsx (profile completion meter, stats, placeholders)
│   │   │   └── NotFoundPage.jsx     # Clean 404 handler
│   │   ├── services/
│   │   │   ├── api.js               # Central fetch client (configured with credentials: 'include')
│   │   │   ├── authService.js       # register, login, logout, getCurrentUser
│   │   │   ├── userService.js       # getMyProfile, updateMyProfile, addSkill, removeSkill, getUserById
│   │   │   └── adminService.js      # getUsers, getUserById, updateUserStatus
│   │   ├── styles/
│   │   │   ├── tokens.css           # CSS variables: colors, typography, elevations, border radii
│   │   │   └── global.css           # Base styles, reset, utility classes
│   │   ├── utils/                   # getDefaultDashboardPath navigation helper
│   │   ├── App.jsx                  # React Router v7 routes with ProtectedRoute guards
│   │   └── main.jsx                 # Client entry point
│   ├── .env.example                 # VITE_API_URL=http://localhost:5001/api
│   ├── package.json
│   └── vite.config.js
├── server/                          # Express.js REST API
│   ├── prisma/
│   │   ├── migrations/
│   │   │   └── 20261107083835_init/ # Baseline migration (10 models + 7 enums)
│   │   ├── seed.js                  # Idempotent admin account seeder
│   │   └── schema.prisma            # Canonical Prisma schema
│   ├── prisma.config.ts             # Prisma 7 datasource & migration configuration
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # PrismaClient singleton with @prisma/adapter-pg
│   │   │   └── index.js             # Centralized process.env validation & defaults
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # authenticateToken & authorizeRoles middlewares
│   │   │   ├── errorMiddleware.js   # Centralized error handler (maps Prisma codes P2002, P2025)
│   │   │   └── notFoundMiddleware.js# 404 JSON response handler
│   │   ├── modules/
│   │   │   ├── admin/               # admin.controller.js, admin.routes.js
│   │   │   ├── auth/                # auth.controller.js, auth.routes.js
│   │   │   ├── skills/              # skills.controller.js, skills.routes.js
│   │   │   └── users/               # users.controller.js, users.routes.js
│   │   ├── app.js                   # Express application setup, CORS, cookie-parser, routing
│   │   └── server.js                # Server entry point with graceful SIGTERM/SIGINT shutdown
│   ├── .env.example                 # Server environment variable template
│   └── package.json
├── .gitignore
└── README.md
```

---

## 4. Database Architecture & Schema Specification

The database is built on **PostgreSQL** and managed with **Prisma ORM 7**. All 10 models and 7 enums were already generated and migrated in migration `20261107083835_init`.

### Prisma 7 Implementation Note
In Prisma 7, `schema.prisma` does not hold the database URL string directly. Instead:
- `server/prisma.config.ts` configures the datasource URL for migrations.
- `server/src/config/database.js` initializes the PostgreSQL pool with `@prisma/adapter-pg`:
  ```javascript
  const { Pool } = require('pg');
  const { PrismaPg } = require('@prisma/adapter-pg');
  const { PrismaClient } = require('@prisma/client');

  const pool = new Pool({ connectionString: config.databaseUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  module.exports = prisma;
  ```
**Always import `prisma` from `src/config/database.js`. Never call `new PrismaClient()` in modules.**

---

### Database Models Overview

```mermaid
erDiagram
    User ||--o| Profile : "has (1:1)"
    User ||--o{ UserSkill : "has many"
    Skill ||--o{ UserSkill : "belongs to"
    User ||--o{ JobPost : "posts (ALUMNI)"
    JobPost ||--o{ JobReferral : "receives"
    User ||--o{ JobReferral : "requests (STUDENT)"
    User ||--o{ JobReferral : "evaluates (ALUMNI)"
    User ||--o{ MentorshipSlot : "offers (ALUMNI)"
    MentorshipSlot ||--o{ MentorshipRequest : "booked via"
    User ||--o{ MentorshipRequest : "requests (STUDENT)"
    User ||--o{ Event : "organizes"
    Event ||--o{ EventRegistration : "registers"
    User ||--o{ EventRegistration : "attends"
```

### Models Specific to Member 2 Scope

#### `JobPost`
Represents an opportunity posted by an Alumni member.
```prisma
model JobPost {
  id              Int             @id @default(autoincrement())
  title           String
  description     String
  company         String
  location        String
  employmentType  EmploymentType
  experienceLevel ExperienceLevel
  applicationUrl  String?
  deadline        DateTime?
  postedById      Int
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  postedBy  User          @relation("UserJobPosts", fields: [postedById], references: [id], onDelete: Restrict)
  referrals JobReferral[]

  @@index([postedById])
  @@index([company])
  @@index([deadline])
}
```

#### `JobReferral`
Represents a student's referral request for a job post, routed to the alumni who posted it.
```prisma
model JobReferral {
  id        Int            @id @default(autoincrement())
  studentId Int
  alumniId  Int
  jobPostId Int
  message   String?
  status    ReferralStatus @default(PENDING)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  student User    @relation("StudentJobReferrals", fields: [studentId], references: [id], onDelete: Restrict)
  alumni  User    @relation("AlumniJobReferrals", fields: [alumniId], references: [id], onDelete: Restrict)
  jobPost JobPost @relation(fields: [jobPostId], references: [id], onDelete: Cascade)

  @@unique([studentId, jobPostId]) // Enforces: One referral per student per job
  @@index([studentId])
  @@index([alumniId])
  @@index([jobPostId])
  @@index([status])
}
```

#### Enums Utilized by Member 2
- **`Role`**: `STUDENT`, `ALUMNI`, `ADMIN`
- **`EmploymentType`**: `FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `CONTRACT`, `REMOTE`
- **`ExperienceLevel`**: `ENTRY`, `MID`, `SENIOR`, `LEAD`
- **`ReferralStatus`**: `PENDING`, `REVIEWED`, `ACCEPTED`, `REJECTED`

---

## 5. Existing Phase 1 Backend API Specifications

The base server URL is `http://localhost:5001/api`.

| HTTP Method | Route | Auth Required | Role Restrictions | Description |
|---|---|---|---|---|
| `GET` | `/health` | No | None | System uptime and API verification |
| `POST` | `/auth/register` | No | None (`STUDENT` / `ALUMNI` only) | Registers user, hashes password, sets JWT cookie |
| `POST` | `/auth/login` | No | None | Verifies credentials, sets JWT cookie |
| `POST` | `/auth/logout` | No | None | Clears JWT cookie |
| `GET` | `/auth/me` | Yes | Any | Returns decoded token payload (`req.user`) |
| `GET` | `/users/me` | Yes | Any | Returns user record with Profile & Skills |
| `PUT` | `/users/me` | Yes | Any | Updates user profile fields & name |
| `GET` | `/users/:id` | No | None | Public discovery of user profile & skills |
| `GET` | `/skills` | No | None | Searchable canonical skills catalog (`?search=`) |
| `POST` | `/users/me/skills` | Yes | Any | Associates skill with user (`{ name }` or `{ skillId }`) |
| `DELETE` | `/users/me/skills/:skillId` | Yes | Any | Removes skill from user profile |
| `GET` | `/admin/users` | Yes | `ADMIN` only | Paginated user directory with search/filters |
| `GET` | `/admin/users/:id` | Yes | `ADMIN` only | Detailed user record with relation counts |
| `PATCH` | `/admin/users/:id/status` | Yes | `ADMIN` only | Toggles account active status |

---

## 6. Authentication, JWT, and Security Architecture

### Cookie-Based JWT
1. **Cookie Name:** `token`
2. **Options Configured:**
   - `httpOnly: true` (inaccessible to JavaScript `document.cookie` — prevents XSS token theft)
   - `sameSite: 'lax'` (prevents CSRF vulnerabilities)
   - `secure: process.env.NODE_ENV === 'production'` (transmits over HTTPS in production)
   - `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days)
3. **Fallback:** `authMiddleware.js` also supports `Authorization: Bearer <token>` in the header, enabling easy Postman or CLI testing.
4. **Token Payload:**
   ```json
   {
     "userId": 12,
     "email": "student@alumniconnect.edu",
     "role": "STUDENT",
     "iat": 1731110000,
     "exp": 1731714800
   }
   ```

### Middleware Usage in New Routes
Import from `src/middleware/authMiddleware.js`:
```javascript
const { authenticateToken, authorizeRoles } = require('../../middleware/authMiddleware');

// Authenticated route (any logged-in user)
router.get('/jobs', authenticateToken, listJobs);

// Role-restricted route (ALUMNI only)
router.post('/jobs', authenticateToken, authorizeRoles('ALUMNI'), createJob);

// Role-restricted route (STUDENT only)
router.post('/jobs/:id/referrals', authenticateToken, authorizeRoles('STUDENT'), requestReferral);
```

### Context Attached to `req`
When `authenticateToken` runs, it attaches:
```javascript
req.user = {
  userId: payload.userId,
  email: payload.email,
  role: payload.role
};
```
Always use `req.user.userId` as the author or requester ID. **Never accept the author's userId from `req.body`**, as this would create an IDOR vulnerability.

---

## 7. Frontend Architecture & Routing Structure

### Routing Tree (`client/src/App.jsx`)
```text
/                  -> Redirects to /login or role dashboard based on auth state
/login             -> LoginPage (AuthLayout)
/register          -> RegisterPage (AuthLayout)
/profile           -> ProfilePage (DashboardLayout, all authenticated roles)

Protected Student Routes:
/student/dashboard -> StudentDashboard (DashboardLayout, role: STUDENT)

Protected Alumni Routes:
/alumni/dashboard  -> AlumniDashboard (DashboardLayout, role: ALUMNI)

Protected Admin Routes:
/admin/dashboard   -> AdminDashboard (DashboardLayout, role: ADMIN)

404 Fallback:
*                  -> NotFoundPage
```

### Services & API Client
The central API helper is `client/src/services/api.js`. It wraps `fetch` and sets `credentials: 'include'` by default so cookies are automatically sent with every request:
```javascript
import api from './api';

// Example: GET request
const data = await api.get('/jobs?company=Google');

// Example: POST request
const newJob = await api.post('/jobs', { title: 'Software Engineer', ... });
```

---

## 8. Environment Variables

### Server (`server/.env`)
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alumni_connect?schema=public"
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@alumniconnect.edu
ADMIN_PASSWORD=Admin@Secure2026!
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5001/api
```

---

## 9. How to Run and Verify the Project

### Start Backend
```bash
cd server
npm install
npm run seed       # Ensures Admin account exists
npm run dev        # Starts Express on http://localhost:5001
```

### Start Frontend
```bash
cd client
npm install
npm run dev        # Starts Vite on http://localhost:5173
```

### Run Quality Checks
```bash
cd client
npm run lint       # oxlint — zero warnings/errors
npm run build      # Vite production build test
```

---

## 10. Existing Limitations & Phase 1 Scope Boundaries

1. **Localhost Execution Only:** The platform runs locally on `http://localhost:5001` (backend) and `http://localhost:5173` (frontend). Port `5001` is deliberately chosen over `5000` to prevent collisions with macOS AirPlay Receiver.
2. **Dashboard Placeholders:**
   - In `StudentDashboard.jsx`, the "Available Jobs & Referrals", "Mentorship Sessions", and "Upcoming Events" cards currently have placeholder badges (`Phase 2` / `Phase 3`). Member 2 should connect the Jobs action button to the new Job Board.
   - In `AlumniDashboard.jsx`, the "Post Job / Internship" action button is ready to link to Member 2's new job creation modal/page.
3. **No File Uploads Yet:** Profile pictures and resume attachments are currently represented as URL strings (`linkedinUrl`, `applicationUrl`). If resumes are needed for referrals, accept a `resumeUrl` or Google Drive link string.

---

## 11. Step-by-Step Implementation Instructions for Member 2

### Step 1: Create Backend Module `server/src/modules/jobs/`
Create the following files:
1. `server/src/modules/jobs/jobs.controller.js`
2. `server/src/modules/jobs/jobs.routes.js`

### Step 2: Implement JobPost Endpoints
Mount routes under `/api/jobs` in `server/src/app.js`:
```javascript
const jobsRouter = require('./modules/jobs/jobs.routes');
app.use('/api/jobs', jobsRouter);
```

#### Endpoints Required:
1. **`POST /api/jobs`**
   - **Auth:** `authenticateToken`, `authorizeRoles('ALUMNI')`
   - **Body:** `{ title, description, company, location, employmentType, experienceLevel, applicationUrl, deadline }`
   - **Validation:** Ensure required fields (`title`, `description`, `company`, `location`, `employmentType`, `experienceLevel`) are present and enums match `EmploymentType` and `ExperienceLevel`.
   - **Database Insertion:**
     ```javascript
     const job = await prisma.jobPost.create({
       data: {
         ...validatedData,
         postedById: req.user.userId,
       },
     });
     ```
2. **`GET /api/jobs`**
   - **Auth:** `authenticateToken` (Students, Alumni, and Admin can browse)
   - **Query Parameters:** `search`, `company`, `employmentType`, `experienceLevel`, `page = 1`, `limit = 10`
   - **Response:** Return paginated jobs with poster details (`postedBy: { select: { id: true, name: true, profile: true } }`).
3. **`GET /api/jobs/:id`**
   - **Auth:** `authenticateToken`
   - **Response:** Detailed single job post including alumni poster information.
4. **`PUT /api/jobs/:id`**
   - **Auth:** `authenticateToken`
   - **Authorization:** Only the alumni who created the job (`postedById === req.user.userId`) or `ADMIN` can update.
5. **`DELETE /api/jobs/:id`**
   - **Auth:** `authenticateToken`
   - **Authorization:** Only the alumni creator or `ADMIN`.
6. **`GET /api/jobs/my`**
   - **Auth:** `authenticateToken`, `authorizeRoles('ALUMNI')`
   - **Response:** Returns all jobs posted by `req.user.userId` with referral request counts.

---

### Step 3: Implement JobReferral Endpoints
Referral requests bridge Students and Alumni.

#### Endpoints Required:
1. **`POST /api/jobs/:id/referrals`**
   - **Auth:** `authenticateToken`, `authorizeRoles('STUDENT')`
   - **Body:** `{ message }`
   - **Validation:**
     - Check if job exists (`jobPostId = parseInt(req.params.id)`).
     - Fetch `job.postedById` to populate `alumniId`.
     - Check for duplicate referral: `prisma.jobReferral.findUnique({ where: { studentId_jobPostId: { studentId: req.user.userId, jobPostId } } })`. If exists, return HTTP 409 Conflict.
   - **Database Insertion:**
     ```javascript
     const referral = await prisma.jobReferral.create({
       data: {
         studentId: req.user.userId,
         alumniId: job.postedById,
         jobPostId: job.id,
         message: req.body.message || null,
         status: 'PENDING',
       },
     });
     ```
2. **`GET /api/alumni/referrals`**
   - **Auth:** `authenticateToken`, `authorizeRoles('ALUMNI')`
   - **Query Parameters:** `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `REVIEWED`)
   - **Response:** Referrals where `alumniId === req.user.userId`, including `student` name, profile, and `userSkills`.
3. **`GET /api/student/referrals`**
   - **Auth:** `authenticateToken`, `authorizeRoles('STUDENT')`
   - **Response:** Referrals where `studentId === req.user.userId`, including `jobPost` details and current `status`.
4. **`PATCH /api/referrals/:id/status`**
   - **Auth:** `authenticateToken`, `authorizeRoles('ALUMNI')`
   - **Body:** `{ status }` (must be `REVIEWED`, `ACCEPTED`, or `REJECTED`)
   - **Authorization:** Ensure `referral.alumniId === req.user.userId`. If not, return HTTP 403 Forbidden.

---

### Step 4: Intelligent Matching Algorithm Guidance

To implement intelligent matching between students and jobs/alumni:
1. **Create an endpoint:** `GET /api/jobs/:id/match` or `GET /api/jobs/recommendations`.
2. **Scoring Logic Formula:**
   $$ \text{Match Score} = (W_{\text{skills}} \times S_{\text{skills}}) + (W_{\text{branch}} \times S_{\text{branch}}) + (W_{\text{industry}} \times S_{\text{industry}}) $$
   - **Skills Overlap ($W = 0.50$):**
     Compare the student's skills (`user.userSkills.map(us => us.skill.name.toLowerCase())`) with skills mentioned in the job description or required skills tags.
     $$ S_{\text{skills}} = \frac{|\text{Student Skills} \cap \text{Job Skills}|}{\max(|\text{Job Skills}|, 1)} $$
   - **Academic Branch Alignment ($W = 0.30$):**
     Compare `student.profile.branch` with the alumni poster's `profile.branch`. A match gives $1.0$, otherwise $0.0$.
   - **Industry / Career Interest ($W = 0.20$):**
     Compare `student.profile.careerGoals` or `industry` keywords with `jobPost.company` and `jobPost.description`.
3. **Response:** Return jobs sorted descending by `matchScore` with a percentage indicator (e.g., `85% Match`).

---

### Step 5: Frontend Integration for Member 2

1. **Create `client/src/services/jobService.js`:**
   - `getJobs(params)`
   - `getJobById(id)`
   - `createJob(jobData)`
   - `updateJob(id, jobData)`
   - `deleteJob(id)`
   - `getMyJobs()`
   - `requestReferral(jobId, { message })`
   - `getAlumniReferrals(params)`
   - `getStudentReferrals()`
   - `updateReferralStatus(referralId, status)`
2. **Create Frontend Pages (`client/src/pages/jobs/`):**
   - `JobBoardPage.jsx`: Filterable job listings, search input, match score badges.
   - `JobDetailsPage.jsx`: Full description, poster details, and "Request Referral" modal.
   - `CreateJobPage.jsx` or modal: Accessible to Alumni.
   - `ReferralManagementPage.jsx`: For Alumni to review, accept, or reject incoming requests.
3. **Update Navigation:**
   - Link the "Browse Jobs" button in `StudentDashboard.jsx` to `/jobs`.
   - Link the "Post Job" button in `AlumniDashboard.jsx` to `/jobs/create`.
   - Add "Jobs" to the sidebar links in `client/src/components/navigation/Sidebar.jsx`.

---

## 12. Testing Recommendations for Member 2

1. **Verify Role Authorization:**
   - Ensure a `STUDENT` receives HTTP 403 when trying to `POST /api/jobs`.
   - Ensure an `ALUMNI` cannot request a referral for their own job.
   - Ensure an `ALUMNI` cannot update the status of another alumni's referral request.
2. **Verify Unique Constraints:**
   - Submitting a referral request twice for the same job must return HTTP 409 Conflict.
3. **Run Code Quality Tools:**
   ```bash
   cd client && npm run lint && npm run build
   ```

---

## 13. Phase 3 (Member 3) Forward Compatibility

Member 3 will implement:
- **Mentorship Slots & Booking:** Models `MentorshipSlot` and `MentorshipRequest` are already present in Prisma schema.
- **Events & Registrations:** Models `Event` and `EventRegistration` are already present in Prisma schema.
- **Rules for Member 2:** Do not delete or alter relations referencing `mentorshipSlots`, `mentorshipRequests`, `organizedEvents`, or `eventRegistrations` in `schema.prisma`.

---

## 14. Git Baseline Reference

- **Git Branch:** `main`
- **Latest Commit Hash:** `06e8ce6`
- **Commit Message:** `test: integrate and validate authentication and profiles`
- **Remote:** `https://github.com/avkashs0521/AlumniConnect`
