# AlumniConnect

[![Node.js](https://img.shields.io/badge/Node.js-v25.2.1-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.3.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v19.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8.3.6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.10.1-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Code Quality](https://img.shields.io/badge/Linter-oxlint-brightgreen)](https://oxc-project.github.io/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**Enterprise University Networking, Career Opportunities & Mentorship Platform**

AlumniConnect is a full-stack university engagement platform that bridges the gap between ambitious students, accomplished alumni, and academic administrators. By combining verified institutional identities, skill portfolios, an internal referral engine, explainable recommendation matching, structured 1-on-1 mentorship, campus events, and real-time notifications, AlumniConnect creates a high-trust professional ecosystem for collegiate communities.

---

## 📑 Table of Contents

1. [Project Overview & Objectives](#-project-overview--objectives)
2. [Technology Stack](#-technology-stack)
3. [System Architecture](#-system-architecture)
4. [Implemented Feature Modules](#-implemented-feature-modules)
5. [Responsive Design System](#-responsive-design-system)
6. [Repository & Directory Structure](#-repository--directory-structure)
7. [Database Architecture & Data Models](#-database-architecture--data-models)
8. [Installation & Setup Guide](#-installation--setup-guide)
9. [Environment Configuration](#-environment-configuration)
10. [PostgreSQL & Prisma Setup](#-postgresql--prisma-setup)
11. [Administrative Account Seeding](#-administrative-account-seeding)
12. [Execution Commands](#-execution-commands)
13. [Intelligent Matching & Scoring Formula](#-intelligent-matching--scoring-formula)
14. [Complete API Documentation](#-complete-api-documentation)
15. [Authentication & Security Architecture](#-authentication--security-architecture)
16. [Role-Based Access Control (RBAC) Matrix](#-role-based-access-control-rbac-matrix)
17. [Quality Assurance & Verification](#-quality-assurance--verification)
18. [Production Deployment & Operational Notes](#-production-deployment--operational-notes)

---

## 📖 Project Overview & Objectives

### Problem Statement
University alumni networks are among the most valuable assets an institution possesses, yet institutional engagement suffers from critical bottlenecks:
- **Cold Outreach Inefficacy:** Students struggle to obtain career guidance or job referrals on generic social networks where alumni are flooded with unvetted inquiries.
- **Fragmented Data:** Universities lose touch with alumni cohorts, lacking updated insight into their companies, designations, and willingness to mentor.
- **Lack of Structured Referrals:** Alumni lack a dedicated campus portal to post internal job openings and review referral candidates from their alma mater without spam.
- **Disconnected Scheduling:** Mentoring happens through ad-hoc emails or direct messaging without integrated calendars or booking boundaries.

### Project Objectives
1. **Verified Community Identity:** Enforce strict role isolation (`STUDENT`, `ALUMNI`, `ADMIN`) with secure cookie-based JWT sessions.
2. **Academic & Career Portfolios:** Allow students and alumni to showcase degrees, graduation years, technical skill taxonomies, and career trajectories.
3. **Internal Job & Referral Engine:** Enable alumni to publish opportunities and receive structured, rate-limited referral applications.
4. **Intelligent Match Scoring:** Automatically compute transparent match scores between student skill profiles, academic branches, and alumni career paths.
5. **1-on-1 Mentorship Scheduling:** Support calendar-driven availability publishing and student session booking.
6. **Campus Events & Webinars:** Enable administrators and alumni to host workshops, reunions, and webinars with registration capacity limits.
7. **Real-time Notifications:** Keep users informed of referral reviews, mentorship confirmations, and event updates via in-app alerts, SSE streams, and optional SMTP email.

---

## 🛠 Technology Stack

### Backend
- **Runtime:** Node.js `v25.2.1` (compatible with `v20.x` and `v22.x` LTS)
- **Framework:** Express.js `v5.3.0`
- **Database:** PostgreSQL `16+`
- **ORM & Connection Pooling:** Prisma ORM `v7.10.1` (`@prisma/client`, `@prisma/adapter-pg`, `pg` `v8.23.1`)
- **Authentication:** JSON Web Tokens (`jsonwebtoken` `v9.0.3`) stored in `HttpOnly`, `SameSite: Lax` cookies
- **Password Hashing:** `bcryptjs` `v3.0.3` (10 salt rounds)
- **Real-Time Streaming:** Server-Sent Events (SSE) for instant notification push
- **Email Transport:** `nodemailer` `v6.10.0` with configurable SMTP transport

### Frontend
- **Framework:** React.js `v19.3.1`
- **Build Tool:** Vite `v8.3.6`
- **Routing:** React Router `v7.18.5`
- **Design System:** Custom CSS Design Tokens (`tokens.css`, `global.css`) — zero heavy runtime CSS dependencies
- **Code Quality:** `oxlint` `v1.90.0` (zero errors, zero warnings across all modules)

---

## 🏛 System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier (React 19 + Vite 8)"]
        UI["UI Pages (Login, Dashboards, Jobs, Community, Profile)"]
        AC["AuthContext (useAuth Hook)"]
        NOTIF["NotificationBell (SSE Stream)"]
        API_SVC["API Client (services/api.js, fetch with credentials)"]
        UI --> AC
        UI --> NOTIF
        AC --> API_SVC
        NOTIF --> API_SVC
    end

    subgraph Server["Server Tier (Node.js + Express 5)"]
        APP["Express Pipeline (CORS, Cookie Parser, Logger)"]
        AUTH_MW["Auth Middleware (authenticateToken, authorizeRoles)"]
        
        subgraph Modules["Domain Modules"]
            M_AUTH["Auth Module (/api/auth)"]
            M_USERS["Users & Profiles (/api/users)"]
            M_SKILLS["Skills Catalog (/api/skills)"]
            M_JOBS["Jobs Board (/api/jobs)"]
            M_REF["Referrals Engine (/api/referrals)"]
            M_MATCH["Matching Engine (/api/network)"]
            M_MENTOR["Mentorship (/api/mentorship)"]
            M_EVENTS["Events (/api/events)"]
            M_NOTIF["Notifications (/api/notifications)"]
            M_ADMIN["Admin Governance (/api/admin)"]
        end
        
        ERR_MW["Centralized Error Middleware"]
        
        APP --> AUTH_MW
        AUTH_MW --> Modules
        Modules --> ERR_MW
    end

    subgraph Database["Data Tier (PostgreSQL 16+)"]
        PRISMA["Prisma Client 7 (pg Pool Adapter)"]
        PG_DB[("PostgreSQL Database\nalumni_connect")]
        
        Modules --> PRISMA
        PRISMA --> PG_DB
    end

    API_SVC -- "HTTP / JSON (HttpOnly Cookie)" --> APP
    M_NOTIF -- "Server-Sent Events (text/event-stream)" --> NOTIF
```

---

## ✨ Implemented Feature Modules

### 1. Authentication & Security
- Public registration restricted strictly to `STUDENT` and `ALUMNI` (payload privilege escalation to `ADMIN` is rejected).
- Strong password enforcement: minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 numeric digit.
- Automatic creation of an initial linked `Profile` record upon user registration.
- Cookie-based JWT storage (`HttpOnly`, `SameSite: Lax`, 7-day expiration) immune to client-side XSS token theft.
- Dual-mode token extraction (`req.cookies.token` or `Authorization: Bearer <token>`).
- Role-based authorization gates (`authorizeRoles('ADMIN')`, `authorizeRoles('ALUMNI')`, `authorizeRoles('STUDENT')`).
- Secure session clearing on logout.

### 2. User & Profile Management
- Full portfolio editing: college, branch, batch, graduation year, bio, company, designation, industry, career goals, and LinkedIn URL.
- Public profile discovery (`GET /api/users/:id`) returning sanitized information (passwords, tokens, and private fields omitted).
- Master canonical skill taxonomy with case-insensitive search and deduplicated user assignments.

### 3. Job Board & Management
- Alumni post opportunities with title, company, description, location, employment type, experience level, application URL, and deadlines.
- Filterable and paginated job search by employment type (`FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `CONTRACT`, `REMOTE`), experience level (`ENTRY`, `MID`, `SENIOR`, `LEAD`), company, location, and required skills.
- Alumni listing owners retain update and deletion rights (`PUT /api/jobs/:id`, `DELETE /api/jobs/:id`).

### 4. Warm Referral Engine
- Students submit warm referral requests to alumni with customized cover messages.
- Database unique constraints (`@@unique([studentId, jobPostId])`) enforce a single active request per student per job.
- Alumni review dashboard displays incoming candidates, matched skills, and academic profile summaries.
- Referral status workflow transitions: `PENDING` $\rightarrow$ `REVIEWED` $\rightarrow$ `ACCEPTED` or `REJECTED`.
- Students track referral request history and status live from their personal dashboard.

### 5. Intelligent Match Scoring
- Proprietary matching algorithm computes a transparent 0–100 match score between students and alumni or job opportunities.
- Evaluates skill overlap (50%), academic branch alignment (30%), and industry/career relevance (20%).
- Provides explainable match badge indicators (`High`, `Mid`, `Low`) with transparent score breakdowns.

### 6. 1-on-1 Mentorship Scheduling
- Alumni publish weekly availability slots (`MentorshipSlot`) specifying topic, expertise, and start/end timestamps.
- Students browse open slots and submit booking requests (`MentorshipRequest`).
- Alumni can accept or decline requests; booking a slot updates its status to `BOOKED` with cascade safety.

### 7. Campus Events & Webinars
- Administrators and alumni organize campus workshops, reunions, and webinars (`Event`).
- Mode selection: `VIRTUAL`, `IN_PERSON`, or `HYBRID`.
- Student and alumni RSVPs (`EventRegistration`) with deadline enforcement and capacity caps.

### 8. Notifications Engine
- Persistent per-user notification inbox tracking unread counts.
- Real-time Server-Sent Events (SSE) push stream (`GET /api/notifications/stream`) delivering instant alerts on status changes.
- Outbound SMTP transport sending email notifications for referral updates, mentorship confirmations, and event reminders.

### 9. Administrative Governance
- Comprehensive user directory (`GET /api/admin/users`) with role filtering, active status filtering, keyword search, and pagination.
- Instant user status toggling (`PATCH /api/admin/users/:id/status`) with safeguards preventing admin self-deactivation or lockout.
- Live administrative metrics summary (`GET /api/admin/stats`) aggregating platform totals for users, jobs, mentorship requests, and events.

---

## 📱 Responsive Design System

The platform features an enterprise responsive design system defined through CSS design tokens (`tokens.css`, `global.css`) supporting screens from small mobile devices (320px) up to ultra-wide desktop monitors:

| Viewport | Target Devices | Layout Behavior |
|---|---|---|
| **Mobile ($\le 640\text{px}$)** | Smartphones (iPhone, Pixel, Galaxy) | Single-column stacking, touch-first inputs, full-width action buttons, bottom-sheet modal drawers, and horizontally swipeable tab bars (`-webkit-overflow-scrolling: touch`). |
| **Tablet ($641\text{px} - 900\text{px}$)** | iPad, Android tablets | Adaptive 2-column grids. Dashboard sidebar automatically converts into an app-style horizontal pill navigation bar to maximize vertical content space. |
| **Desktop ($> 900\text{px}$)** | Laptops and widescreen monitors | Full 260px fixed vertical sidebar, multi-column metric grids, side-by-side job detail panes, and responsive table views. |

---

## 📁 Repository & Directory Structure

```text
AlumniConnect/
├── docs/
│   ├── API_REFERENCE.md             # Complete integrated endpoint inventory
│   ├── MEMBER_1_HANDOVER.md         # Foundation setup, authentication & RBAC notes
│   ├── MEMBER_2_HANDOVER.md         # Job board, referrals & matching architecture
│   └── MEMBER_3_HANDOVER.md         # Mentorship, events & notifications integration
├── client/                          # React 19 Frontend Application (Vite 8)
│   ├── public/                      # Static icons and assets
│   ├── src/
│   │   ├── assets/                  # Graphics and SVGs
│   │   ├── components/
│   │   │   ├── common/              # Button, Card, Input, Select, Textarea, Loading, ErrorAlert, ProtectedRoute
│   │   │   ├── dashboard/           # StatCard, ActivityFeed
│   │   │   └── navigation/          # Navbar, Sidebar, Footer, NotificationBell
│   │   ├── context/                 # AuthContext & AuthProvider session manager
│   │   ├── hooks/                   # useAuth custom hook
│   │   ├── layouts/                 # MainLayout, DashboardLayout, AuthLayout
│   │   ├── pages/
│   │   │   ├── admin/               # AdminDashboard.jsx
│   │   │   ├── alumni/              # AlumniDashboard.jsx
│   │   │   ├── auth/                # LoginPage.jsx, RegisterPage.jsx
│   │   │   ├── community/           # CommunityPages.jsx (Mentorship & Events)
│   │   │   ├── jobs/                # JobBoardPage, JobDetailsPage, CreateJobPage, EditJobPage, MyJobsPage
│   │   │   ├── network/             # RecommendationsPage.jsx
│   │   │   ├── profile/             # ProfilePage.jsx
│   │   │   ├── referrals/           # StudentReferralsPage, AlumniReferralsPage
│   │   │   ├── student/             # StudentDashboard.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── services/
│   │   │   ├── api.js               # Central fetch client with credentials: 'include'
│   │   │   ├── authService.js       # Auth API client
│   │   │   ├── userService.js       # Profiles & skills API client
│   │   │   ├── jobService.js        # Jobs & referrals API client
│   │   │   ├── communityService.js  # Mentorship & events API client
│   │   │   ├── notificationService.js # Notification inbox & stream client
│   │   │   └── adminService.js      # Governance API client
│   │   ├── styles/
│   │   │   ├── tokens.css           # Semantic design tokens (colors, typography, spacing, shadows)
│   │   │   └── global.css           # Global resets and responsive utilities
│   │   ├── utils/                   # Navigation utilities
│   │   ├── App.jsx                  # Route definitions and role guards
│   │   └── main.jsx                 # Client entry point
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/                          # Express 5 API Server (Node.js)
│   ├── prisma/
│   │   ├── migrations/              # SQL migration history
│   │   ├── schema.prisma            # Database models, relations, enums, indexes
│   │   └── seed.js                  # Idempotent administrator account seed
│   ├── prisma.config.ts             # Prisma 7 configuration file
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # PrismaClient singleton & pg Pool adapter
│   │   │   └── index.js             # Environment variable loader with defaults
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # JWT validation & role authorization gates
│   │   │   ├── errorMiddleware.js   # Centralized error handler (maps Prisma P2002/P2025)
│   │   │   └── notFoundMiddleware.js# Standard 404 JSON handler
│   │   ├── modules/
│   │   │   ├── admin/               # Governance controller, routes, service
│   │   │   ├── auth/                # Authentication controller, routes, service
│   │   │   ├── events/              # Event management and registration
│   │   │   ├── jobs/                # Job board controller, routes, service
│   │   │   ├── mentorship/          # Mentorship slot scheduling and requests
│   │   │   ├── network/             # Matching algorithm and candidate recommendations
│   │   │   ├── notifications/       # Persisted notifications and SSE stream
│   │   │   ├── referrals/           # Warm referral request workflows
│   │   │   ├── skills/              # Canonical skill taxonomy
│   │   │   └── users/               # Profile management
│   │   ├── app.js                   # Express pipeline and route mounting
│   │   └── server.js                # Server entry point & graceful shutdown
│   ├── tests/                       # Unit tests (validation and matching)
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🗄 Database Architecture & Data Models

Managed through **Prisma ORM 7** on **PostgreSQL 16+**. The database contains 11 models and 10 enums with explicit indexing, compound unique constraints, and referential actions.

### Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o| Profile : "1-to-1 (Cascade)"
    User ||--o{ UserSkill : "has many (Cascade)"
    Skill ||--o{ UserSkill : "assigned to (Cascade)"
    User ||--o{ JobPost : "posts (Restrict)"
    JobPost ||--o{ JobReferral : "has (Cascade)"
    User ||--o{ JobReferral : "requests (Restrict)"
    User ||--o{ JobReferral : "reviews (Restrict)"
    User ||--o{ MentorshipSlot : "hosts (Restrict)"
    MentorshipSlot ||--o{ MentorshipRequest : "scheduled via (Cascade)"
    User ||--o{ MentorshipRequest : "requests (Restrict)"
    User ||--o{ Event : "organizes (Restrict)"
    Event ||--o{ EventRegistration : "has (Cascade)"
    User ||--o{ EventRegistration : "attends (Cascade)"
    User ||--o{ Notification : "receives (Cascade)"
```

### Models Detail

#### 1. `User`
Core identity representing Students, Alumni, and Administrators.
- `id` (`Int`, Primary Key, autoincrement)
- `name` (`String`), `email` (`String`, Unique, indexed), `passwordHash` (`String`)
- `role` (`Role`: `STUDENT`, `ALUMNI`, `ADMIN`, default `STUDENT`, indexed)
- `isActive` (`Boolean`, default `true`)
- `createdAt` (`DateTime`, default `now()`), `updatedAt` (`DateTime`, auto-updated)

#### 2. `Profile`
Extended academic and career portfolio (1-to-1 with `User`).
- `id` (`Int`, Primary Key, autoincrement)
- `userId` (`Int`, Unique, FK $\rightarrow$ `User.id`, `onDelete: Cascade`)
- `college` (`String?`), `branch` (`String?`), `batch` (`String?`), `graduationYear` (`Int?`)
- `bio` (`String?`), `company` (`String?`), `designation` (`String?`), `industry` (`String?`), `careerGoals` (`String?`), `linkedinUrl` (`String?`)

#### 3. `Skill`
Master canonical taxonomy of technical and domain skills.
- `id` (`Int`, Primary Key, autoincrement)
- `name` (`String`, Unique)

#### 4. `UserSkill`
Explicit join entity linking Users to Skills.
- `id` (`Int`, Primary Key, autoincrement)
- `userId` (`Int`, FK $\rightarrow$ `User.id`, `onDelete: Cascade`), `skillId` (`Int`, FK $\rightarrow$ `Skill.id`, `onDelete: Cascade`)
- `createdAt` (`DateTime`, default `now()`)
- `@@unique([userId, skillId])` (Prevents duplicate skill assignments)

#### 5. `JobPost`
Career opportunities posted by Alumni.
- `id` (`Int`, Primary Key, autoincrement)
- `title` (`String`), `description` (`String`), `company` (`String`, indexed), `location` (`String`)
- `employmentType` (`EmploymentType`: `FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `CONTRACT`, `REMOTE`)
- `experienceLevel` (`ExperienceLevel`: `ENTRY`, `MID`, `SENIOR`, `LEAD`)
- `applicationUrl` (`String?`), `deadline` (`DateTime?`, indexed)
- `postedById` (`Int`, FK $\rightarrow$ `User.id`, indexed, `onDelete: Restrict`)

#### 6. `JobReferral`
Referral requests submitted by Students to Alumni.
- `id` (`Int`, Primary Key, autoincrement)
- `studentId` (`Int`, FK $\rightarrow$ `User.id`, indexed), `alumniId` (`Int`, FK $\rightarrow$ `User.id`, indexed)
- `jobPostId` (`Int`, FK $\rightarrow$ `JobPost.id`, indexed, `onDelete: Cascade`)
- `message` (`String?`), `status` (`ReferralStatus`: `PENDING`, `REVIEWED`, `ACCEPTED`, `REJECTED`, default `PENDING`, indexed)
- `@@unique([studentId, jobPostId])` (Enforces 1 referral application per student per job)

#### 7. `MentorshipSlot`
Office hour availability windows published by Alumni.
- `id` (`Int`, Primary Key, autoincrement)
- `alumniId` (`Int`, FK $\rightarrow$ `User.id`, indexed, `onDelete: Restrict`)
- `topic` (`String`), `description` (`String?`), `expertise` (`String?`)
- `startTime` (`DateTime`, indexed), `endTime` (`DateTime`)
- `status` (`MentorshipSlotStatus`: `AVAILABLE`, `BOOKED`, `COMPLETED`, `CANCELLED`, default `AVAILABLE`, indexed)

#### 8. `MentorshipRequest`
Student booking requests submitted for specific Mentorship Slots.
- `id` (`Int`, Primary Key, autoincrement)
- `studentId` (`Int`, FK $\rightarrow$ `User.id`, indexed, `onDelete: Restrict`)
- `slotId` (`Int`, FK $\rightarrow$ `MentorshipSlot.id`, indexed, `onDelete: Cascade`)
- `message` (`String?`), `status` (`MentorshipRequestStatus`: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, default `PENDING`, indexed)
- `@@unique([studentId, slotId])` (Prevents double booking submissions)

#### 9. `Event`
Campus workshops, alumni reunions, and webinars.
- `id` (`Int`, Primary Key, autoincrement)
- `title` (`String`), `description` (`String`), `category` (`EventCategory`: `WEBINAR`, `WORKSHOP`, `REUNION`, `NETWORKING`, `CAREER_FAIR`, `TALK`, `OTHER`, indexed)
- `location` (`String`), `eventType` (`EventType`: `VIRTUAL`, `IN_PERSON`, `HYBRID`)
- `startDate` (`DateTime`, indexed), `endDate` (`DateTime`), `registrationDeadline` (`DateTime?`), `capacity` (`Int?`)
- `organizerId` (`Int`, FK $\rightarrow$ `User.id`, indexed, `onDelete: Restrict`)

#### 10. `EventRegistration`
Attendee RSVPs linking Students, Alumni, and Admins to Events.
- `id` (`Int`, Primary Key, autoincrement)
- `eventId` (`Int`, FK $\rightarrow$ `Event.id`, indexed, `onDelete: Cascade`), `userId` (`Int`, FK $\rightarrow$ `User.id`, indexed, `onDelete: Cascade`)
- `status` (`RegistrationStatus`: `REGISTERED`, `ATTENDED`, `CANCELLED`, default `REGISTERED`, indexed)
- `@@unique([eventId, userId])` (Prevents duplicate event registrations)

#### 11. `Notification`
Persistent multi-channel user alerts.
- `id` (`Int`, Primary Key, autoincrement)
- `userId` (`Int`, FK $\rightarrow$ `User.id`, indexed, `onDelete: Cascade`)
- `type` (`NotificationType`: `SYSTEM`, `REFERRAL_SUBMITTED`, `REFERRAL_UPDATED`, `MENTORSHIP_REQUESTED`, `MENTORSHIP_ACCEPTED`, `MENTORSHIP_DECLINED`, `EVENT_REMINDER`, `EVENT_UPDATED`)
- `title` (`String`), `message` (`String`), `href` (`String?`), `readAt` (`DateTime?`)
- `createdAt` (`DateTime`, default `now()`)

---

## 💻 Installation & Setup Guide

### Prerequisites
- **Node.js:** `v20.x` or `v25.x`
- **npm:** `v9+` or `v11+`
- **PostgreSQL:** `v14+` or `v16+` running locally on port `5432`
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/avkashs0521/AlumniConnect.git
cd AlumniConnect
```

---

## ⚙ Environment Configuration

### Backend Environment (`server/.env`)
Create `server/.env` based on `server/.env.example`:
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alumni_connect?schema=public"

# Authentication
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# Initial Administrator Seed Credentials
ADMIN_EMAIL=admin@alumniconnect.edu
ADMIN_PASSWORD=Admin@Secure2026!

# Optional SMTP Email Notifications
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your_smtp_user
# SMTP_PASSWORD=your_smtp_password
# SMTP_FROM="AlumniConnect <noreply@alumniconnect.edu>"
```

> [!TIP]
> On macOS with Homebrew PostgreSQL, `DATABASE_URL` can also connect using your current system user:  
> `postgresql://$(whoami)@localhost:5432/alumni_connect?schema=public`

### Frontend Environment (`client/.env`)
Create `client/.env` based on `client/.env.example`:
```env
VITE_API_URL=http://localhost:5001/api
```

---

## 🐘 PostgreSQL & Prisma Setup

1. **Create the PostgreSQL database:**
   ```bash
   createdb alumni_connect
   # Or using psql:
   # psql -U postgres -c "CREATE DATABASE alumni_connect;"
   ```

2. **Run Prisma Migrations & Generate Client:**
   ```bash
   cd server
   npm install
   npx prisma migrate deploy
   npx prisma generate
   ```

---

## 🛡 Administrative Account Seeding

The server includes an idempotent seed script to create the initial System Administrator:

```bash
cd server
npm run seed
```

**Default Admin Credentials:**
- **Email:** `admin@alumniconnect.edu`
- **Password:** `Admin@Secure2026!` (configured via `ADMIN_PASSWORD` in `server/.env`)
- **Role:** `ADMIN`

---

## ⚡ Execution Commands

### Run Backend Server (Express API)
```bash
cd server
npm run dev
# Runs nodemon src/server.js on http://localhost:5001
```

### Run Frontend Client (Vite React)
```bash
cd client
npm run dev
# Starts Vite dev server on http://localhost:5173
```

### Run Testing & Quality Assurance
```bash
# In server directory:
npm test                 # Runs deterministic unit tests (validation & matching)

# In client directory:
npm run lint             # Runs oxlint across all React components
npm run build            # Validates production Vite compilation
```

---

## 🧮 Intelligent Matching & Scoring Formula

The matching engine located in [`server/src/modules/network/matching.service.js`](server/src/modules/network/matching.service.js) computes an explainable 0–100 match score for students browsing alumni mentors and job postings:

$$\text{Total Score} = S_{\text{skills}} + S_{\text{branch}} + S_{\text{industry}}$$

1. **Skill Overlap Score ($S_{\text{skills}}$, max 50 points):**
   $$S_{\text{skills}} = \text{round}\left( \frac{\text{Matched Skills Count}}{\text{Total Required Skills Count}} \times 50 \right)$$
2. **Academic Branch Alignment ($S_{\text{branch}}$, max 30 points):**
   - **30 points:** Exact branch match (using canonical branch alias normalization, e.g. "Computer Science", "CSE", "CS").
   - **0 points:** Non-matching branch.
3. **Industry & Career Trajectory Alignment ($S_{\text{industry}}$, max 20 points):**
   - Matches keywords between the student's career goals and the alumnus's industry/designation.

**Match Tier Classifications:**
- **High Match (80–100):** Displayed with green badge `score-high`.
- **Medium Match (50–79):** Displayed with blue badge `score-mid`.
- **Low Match (< 50):** Displayed with amber badge `score-low`.

---

## 📡 Complete API Documentation

Base URL: `http://localhost:5001/api`

### 1. System Health
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | System status and operational health |

### 2. Authentication (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register as `STUDENT` or `ALUMNI` |
| `POST` | `/auth/login` | Public | Authenticate user & issue `HttpOnly` JWT cookie |
| `POST` | `/auth/logout` | Public | Terminate session & clear cookies |
| `GET` | `/auth/me` | Authenticated | Retrieve current session payload |
| `GET` | `/auth/admin/verify` | `ADMIN` | Validate administrative authority |

### 3. User & Profile Management (`/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users/me` | Authenticated | Retrieve authenticated user profile with skills |
| `PUT` | `/users/me` | Authenticated | Update user name and detailed academic/career profile |
| `GET` | `/users/:id` | Public | Discover public profile details for active user |
| `POST` | `/users/me/skills` | Authenticated | Associate technical skill with profile (deduplicated) |
| `DELETE` | `/users/me/skills/:skillId` | Authenticated | Remove skill association |

### 4. Skills Taxonomy (`/skills`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/skills?search=` | Public | Search master canonical skill catalog |

### 5. Job Board (`/jobs`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/jobs` | Authenticated | Search, filter, and paginate job opportunities |
| `POST` | `/jobs` | `ALUMNI` | Create a new job opportunity |
| `GET` | `/jobs/my` | `ALUMNI` | List opportunities posted by current user |
| `GET` | `/jobs/:id` | Authenticated | View detailed job description and poster info |
| `PUT` | `/jobs/:id` | Owner / `ADMIN` | Update job post details |
| `DELETE` | `/jobs/:id` | Owner / `ADMIN` | Delete job post and dependent referrals |

### 6. Referral Engine (`/referrals`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/jobs/:id/referrals` | `STUDENT` | Submit warm referral request |
| `GET` | `/referrals/student` | `STUDENT` | List student's submitted referral history |
| `GET` | `/referrals/alumni` | `ALUMNI` | List incoming referral requests for alumni's jobs |
| `PATCH` | `/referrals/:id/status` | Job Owner | Update status (`REVIEWED`, `ACCEPTED`, `REJECTED`) |

### 7. Recommendations & Matching (`/network`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/network/matches` | `STUDENT` | Retrieve ranked alumni matches based on skills & branch |
| `GET` | `/network/jobs/recommendations` | `STUDENT` | Retrieve ranked job opportunity recommendations |

### 8. Mentorship (`/mentorship`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/mentorship/slots` | Authenticated | Browse available future 1-on-1 mentorship slots |
| `GET` | `/mentorship/slots/my` | `ALUMNI` | List slots created by authenticated alumnus |
| `GET` | `/mentorship/slots/:id` | Authenticated | View mentorship slot details |
| `POST` | `/mentorship/slots` | `ALUMNI` | Publish new availability window |
| `PUT` | `/mentorship/slots/:id` | Owner / `ADMIN` | Update unbooked mentorship slot |
| `DELETE` | `/mentorship/slots/:id` | Owner / `ADMIN` | Cancel mentorship slot |
| `POST` | `/mentorship/requests` | `STUDENT` | Book an open mentorship slot |
| `GET` | `/mentorship/requests/sent` | `STUDENT` | List booking requests submitted by student |
| `GET` | `/mentorship/requests/received` | `ALUMNI` / `ADMIN` | List incoming booking requests |
| `PATCH` | `/mentorship/requests/:id/status`| Participant / `ADMIN` | Accept, reject, or cancel mentorship request |

### 9. Campus Events & Webinars (`/events`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/events` | Authenticated | Search upcoming workshops, reunions, and webinars |
| `POST` | `/events` | `ALUMNI` / `ADMIN` | Create a campus event |
| `GET` | `/events/my-events` | Authenticated | List events registered by current user |
| `GET` | `/events/:id` | Authenticated | View event details and user registration status |
| `PUT` | `/events/:id` | Organizer / `ADMIN` | Edit event details and capacity |
| `DELETE` | `/events/:id` | Organizer / `ADMIN` | Cancel and delete event |
| `POST` | `/events/:id/register` | `STUDENT` / `ALUMNI` | Register for event (subject to deadline and capacity) |
| `DELETE` | `/events/:id/register` | `STUDENT` / `ALUMNI` | Cancel event RSVP |
| `GET` | `/events/:id/participants` | Organizer / `ADMIN` | List registered attendees |

### 10. Notifications (`/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/notifications` | Authenticated | Fetch notification inbox and unread counter |
| `GET` | `/notifications/stream` | Authenticated | Real-time Server-Sent Events (SSE) notification stream |
| `PATCH` | `/notifications/:id/read` | Recipient | Mark single notification as read |
| `PATCH` | `/notifications/read-all` | Authenticated | Mark all notifications as read |

### 11. Administrative Governance (`/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/users` | `ADMIN` | Paginated user management table with role/status filters |
| `GET` | `/admin/users/:id` | `ADMIN` | Detailed user audit record with relational activity counts |
| `PATCH` | `/admin/users/:id/status` | `ADMIN` | Toggle user active status (`true` / `false`) |
| `GET` | `/admin/stats` | `ADMIN` | Aggregated platform metrics (users, jobs, mentorship, events) |

---

## 🔒 Authentication & Security Architecture

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Client as React App (Vite)
    participant Server as Express Backend
    participant DB as PostgreSQL (Prisma)

    User->>Client: Submit Login Credentials (email, password)
    Client->>Server: POST /api/auth/login
    Server->>DB: Query User by email
    DB-->>Server: User record (passwordHash, role, isActive)
    Server->>Server: bcrypt.compare(password, passwordHash)
    Server->>Server: jwt.sign({ userId, email, role })
    Server-->>Client: HTTP 200 OK + Set-Cookie: token=JWT; HttpOnly; SameSite=Lax
    Client->>Server: GET /api/users/me (credentials: 'include')
    Server->>DB: Fetch user profile and skills
    DB-->>Server: Profile data
    Server-->>Client: User & Profile JSON
    Client->>User: Route to Role Dashboard
```

1. **HttpOnly Cookie Storage:** JWTs are stored strictly in `HttpOnly` cookies. Client-side scripts cannot access `document.cookie`, completely eliminating XSS token theft.
2. **CSRF Mitigation:** Configured with `SameSite: 'lax'` for same-site cookie security during standard cross-origin requests.
3. **Password Hashing:** Passwords hashed using `bcryptjs` with 10 salt rounds.
4. **Prisma Error Mapping:** Database constraint violations (`P2002`) automatically map to `409 Conflict`, and missing entities (`P2025`) map to `404 Not Found`.

---

## 🛡 Role-Based Access Control (RBAC) Matrix

| Feature / Endpoint | `STUDENT` | `ALUMNI` | `ADMIN` | Public / Unauth |
|---|:---:|:---:|:---:|:---:|
| System Health (`GET /api/health`) | ✅ | ✅ | ✅ | ✅ |
| Public Register (`POST /api/auth/register`) | ✅ | ✅ | ❌ | ✅ |
| Login / Logout | ✅ | ✅ | ✅ | ✅ |
| View Own Profile (`GET /api/users/me`) | ✅ | ✅ | ✅ | ❌ |
| Update Own Profile (`PUT /api/users/me`) | ✅ | ✅ | ✅ | ❌ |
| Browse Skill Taxonomy (`GET /api/skills`) | ✅ | ✅ | ✅ | ✅ |
| Public User Discovery (`GET /api/users/:id`) | ✅ | ✅ | ✅ | ✅ |
| Browse Job Opportunities (`GET /api/jobs`) | ✅ | ✅ | ✅ | ❌ |
| Create Job Opportunity (`POST /api/jobs`) | ❌ | ✅ | ✅ | ❌ |
| Edit/Delete Own Job Post | ❌ | ✅ | ✅ | ❌ |
| Submit Referral Request (`POST /api/jobs/:id/referrals`) | ✅ | ❌ | ❌ | ❌ |
| Review Incoming Referrals (`GET /api/referrals/alumni`) | ❌ | ✅ | ❌ | ❌ |
| Update Referral Status (`PATCH /api/referrals/:id/status`) | ❌ | ✅ | ❌ | ❌ |
| View AI Recommendations (`GET /api/network/*`) | ✅ | ❌ | ❌ | ❌ |
| Publish Mentorship Slot (`POST /api/mentorship/slots`) | ❌ | ✅ | ❌ | ❌ |
| Book Mentorship Slot (`POST /api/mentorship/requests`) | ✅ | ❌ | ❌ | ❌ |
| Accept/Decline Mentorship Request | ❌ | ✅ | ✅ | ❌ |
| Create Campus Event (`POST /api/events`) | ❌ | ✅ | ✅ | ❌ |
| Register for Event (`POST /api/events/:id/register`) | ✅ | ✅ | ❌ | ❌ |
| Access Notification Inbox & Stream | ✅ | ✅ | ✅ | ❌ |
| Admin Governance Console (`/admin`) | ❌ | ❌ | ✅ | ❌ |
| Manage User Directory (`GET/PATCH /api/admin/users`) | ❌ | ❌ | ✅ | ❌ |
| View Platform Statistics (`GET /api/admin/stats`) | ❌ | ❌ | ✅ | ❌ |

---

## 🧪 Quality Assurance & Verification

The project is safeguarded with multi-tier automated checks across frontend and backend:

### 1. Backend Unit Testing
Deterministic unit tests validate input sanitization, URL validation, and matching score computation:
```bash
cd server
npm test
```
- **Coverage:** 8 suites testing job filter normalization, LinkedIn URL validation, skill tokenization, required-skill denominator logic, branch alias normalization, and edge cases.

### 2. Frontend Code Quality & Static Analysis
```bash
cd client
npm run lint
```
- Validated via `oxlint` across all 48 JSX and JS files with **0 warnings and 0 errors**.

### 3. Production Build Compilation
```bash
cd client
npm run build
```
- Validates Vite bundling, tree-shaking, and syntax compatibility with React 19.

---

## 🚀 Production Deployment & Operational Notes

### Hosting Topology
- **Frontend (`client/`):** Vercel, Netlify, or Cloudflare Pages (Static SPA with rewrite rule to `/index.html`).
- **Backend (`server/`):** Render Web Service, Railway, Fly.io, or VPS with Node 20+.
- **Database:** Managed PostgreSQL 16+ (Neon, Supabase, Render Postgres, AWS RDS).

### Production Environment Checklist
1. **HTTPS Enforcement:** Production cookies use `secure: true` and `sameSite: 'none'`. Both frontend and backend must run behind valid TLS/HTTPS.
2. **`CLIENT_URL` Matching:** Set `CLIENT_URL` in `server/.env` to the exact frontend domain (e.g. `https://alumniconnect.edu`) without trailing slash for CORS credentials verification.
3. **Secret Generation:** Replace `JWT_SECRET` with a cryptographically secure 256-bit string (`openssl rand -base64 32`).
4. **Prisma Migrations in CI/CD:** Use `npx prisma migrate deploy` in build/deploy pipelines to apply migrations safely.
5. **SMTP Configuration:** Provide production SMTP host and credentials in `server/.env` to enable real email dispatch.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
