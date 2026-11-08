# AlumniConnect

[![Node.js](https://img.shields.io/badge/Node.js-v25.2.1-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.3.0-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-v19.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8.3.6-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.10.1-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v16+-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Code Quality](https://img.shields.io/badge/Linter-oxlint-brightgreen)](https://oxc-project.github.io/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

**Intelligent Platform to Interconnect Alumni and Students.**

---

## Table of Contents
1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [Project Objectives](#-project-objectives)
4. [Technology Stack](#-technology-stack)
5. [Features Completed in Phase 1](#-features-completed-in-phase-1)
6. [System Architecture](#-system-architecture)
7. [Repository & Directory Structure](#-repository--directory-structure)
8. [Database Architecture & Data Models](#-database-architecture--data-models)
9. [Installation & Setup Guide](#-installation--setup-guide)
10. [Environment Configuration](#-environment-configuration)
11. [PostgreSQL & Prisma Setup](#-postgresql--prisma-setup)
12. [Administrative Account Seeding](#-administrative-account-seeding)
13. [Execution Commands](#-execution-commands)
14. [Complete API Documentation](#-complete-api-documentation)
15. [Authentication & Session Workflow](#-authentication--session-workflow)
16. [Role-Based Access Control (RBAC) Matrix](#-role-based-access-control-rbac-matrix)
17. [Quality Assurance & Verification](#-quality-assurance--verification)
18. [Future Development Modules & Roadmap](#-future-development-modules--roadmap)
19. [Team Git Commit History](#-team-git-commit-history)

---

## 📖 Project Overview

AlumniConnect is an enterprise-grade university networking platform designed to eliminate the barrier between ambitious students and experienced alumni. By consolidating identity verification, rich academic profiles, technical skill mapping, direct warm referrals, and mentorship scheduling into a unified system, AlumniConnect enables university communities to build long-term, high-trust professional networks.

---

## 🎯 Problem Statement

Universities worldwide graduate thousands of accomplished individuals every year. However, institutional alumni engagement faces systemic bottlenecks:
- **Cold Outreach Inefficacy:** Students struggle to obtain career guidance or job referrals through generic social media platforms where alumni are overwhelmed with unsolicited cold messages.
- **Fragmented Alumni Data:** Colleges often lose contact with graduates as contact directories become outdated, lacking up-to-date insight into alumni companies, designations, or willingness to mentor.
- **Absence of Structured Referrals:** There is no centralized campus mechanism for alumni to advertise open positions at their companies and provide prioritized referrals to vetted students from their alma mater.
- **Lack of Institutional Governance:** Without administrative oversight, universities cannot monitor networking activity, safeguard community integrity, or support career outcomes.

---

## 🚀 Project Objectives

1. **Verified Community Identity:** Provide secure authentication with role enforcement (`STUDENT`, `ALUMNI`, `ADMIN`).
2. **Comprehensive Profile & Skill Portfolios:** Enable students and alumni to showcase degrees, graduation years, technical skills, career goals, and professional positions.
3. **Internal Referral Engine (Phase 2):** Allow alumni to publish job opportunities and review student referral requests without public spam.
4. **Intelligent Student-Alumni Matching (Phase 2 & 3):** Automatically compute match scores based on shared skill taxonomies, academic branches, and career trajectories.
5. **Structured 1-on-1 Mentorship (Phase 3):** Facilitate calendar slot booking for office hours and career coaching.
6. **Centralized Campus Governance:** Give university administrators oversight of user accounts, institutional directories, and platform activity.

---

## 🛠 Technology Stack

### Backend
- **Runtime:** Node.js `v25.2.1` (compatible with `v20.x` LTS and `v22.x` LTS)
- **Framework:** Express.js `v5.3.0`
- **Database:** PostgreSQL `16+`
- **ORM & Driver:** Prisma ORM `v7.10.1` (`@prisma/client`, `@prisma/adapter-pg`, `pg` `v8.23.1`)
- **Authentication:** JSON Web Tokens (`jsonwebtoken` `v9.0.3`) stored in secure, `HttpOnly`, `SameSite: Lax` cookies
- **Password Security:** `bcryptjs` `v3.0.3` (10 salt rounds)
- **Middleware:** `cookie-parser` `v1.4.7`, `cors` `v2.8.6`, `dotenv` `v18.0.9`

### Frontend
- **Framework:** React.js `v19.3.1`
- **Build Tool:** Vite `v8.3.6`
- **Routing:** React Router `v7.18.5`
- **Styling:** Custom CSS Design Tokens (`tokens.css`, `global.css`) — no bloated utility libraries or heavy runtime CSS
- **Code Quality:** `oxlint` `v1.90.0` (zero errors, zero warnings across all modules)

---

## ✨ Features Completed in Phase 1

### 1. Backend Foundation & Architecture
- Modular Express 5 structure with separation of concerns: `config/`, `middleware/`, `modules/`, and `utils/`.
- PostgreSQL integration using Prisma 7 with native connection pooling (`@prisma/adapter-pg`).
- Centralized error handling mapping Prisma error codes (`P2002` duplicate key to `409 Conflict`, `P2025` record not found to `404 Not Found`).
- Strict 404 handler returning JSON responses.
- CORS configured with credentials for Vite dev client.
- Developer HTTP logging displaying method, path, status, and duration.
- Operational health check endpoint (`GET /api/health`).

### 2. Authentication & Authorization (RBAC)
- Public registration restricted strictly to `STUDENT` and `ALUMNI`. Modification of request body to register as `ADMIN` is rejected.
- Robust password strength validation (minimum 8 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 numeric digit).
- Automatic creation of an initial linked `Profile` row upon user registration.
- Cookie-based JWT authentication (`HttpOnly`, `SameSite: Lax`, 7-day expiration).
- Dual-mode token extraction (`req.cookies.token` or `Authorization: Bearer <token>`).
- Role-based authorization middleware (`authorizeRoles('ADMIN')`, `authorizeRoles('ALUMNI')`, etc.).
- Secure logout clearing cookies.
- Idempotent seed script to initialize an Administrator (`admin@alumniconnect.edu`).

### 3. User & Profile Management
- Authenticated user profile retrieval (`GET /api/users/me`) with joined skills.
- Atomic profile updating (`PUT /api/users/me`) supporting academic, professional, and contact fields.
- Public user discovery (`GET /api/users/:id`) returning sanitized data (passwords and internal tokens omitted).
- Normalized canonical skill catalog (`GET /api/skills`) with case-insensitive search.
- Skill assignment (`POST /api/users/me/skills`) with automatic deduplication.
- Skill disassociation (`DELETE /api/users/me/skills/:skillId`).

### 4. Administrative Governance
- User directory listing (`GET /api/admin/users`) with role filtering, status filtering, search, and pagination.
- Full user audit view (`GET /api/admin/users/:id`) with relational counts.
- Account status toggling (`PATCH /api/admin/users/:id/status`) with safeguards preventing self-deactivation or admin lockouts.

### 5. React 19 Frontend & Design System
- Semantic design tokens covering colors, typography, elevations, spacing, and transition curves.
- Fully responsive layout system (`MainLayout`, `DashboardLayout`, `AuthLayout`).
- Reusable UI component library (`Button`, `Card`, `Input`, `Select`, `Textarea`, `Loading`, `ErrorAlert`, `StatCard`, `ActivityFeed`, `ProtectedRoute`).
- Global `AuthContext` and custom `useAuth` hook managing user session, login, registration, and logout.
- Client-side API client (`api.js`) sending `credentials: 'include'` for cookie persistence.
- Role-specific dashboard views:
  - **Student Dashboard:** Profile completion progress bar, skill tags, career interests, and module shortcuts.
  - **Alumni Dashboard:** Company/designation hero card, technical expertise tags, and quick-action triggers.
  - **Admin Dashboard:** Platform stats, real-time user management table, filter bars, and instant active-status toggle buttons.
- Interactive Profile Management page with tabbed view and edit modes, plus live skill addition and removal.

### 6. Automated QA Integration
- 27-suite end-to-end integration test validating backend endpoints, authorization gates, role isolation, and security integrity.

---

## 🏛 System Architecture

```mermaid
flowchart TD
    subgraph Client["Client Tier (React 19 + Vite 8)"]
        UI["UI Pages (Login, Dashboards, Profile)"]
        AC["AuthContext (useAuth Hook)"]
        API_SVC["API Services (api.js, fetch with credentials)"]
        UI --> AC
        AC --> API_SVC
    end

    subgraph Server["Server Tier (Node.js + Express 5)"]
        APP["Express Pipeline (CORS, Cookie Parser, Logger)"]
        AUTH_MW["Auth Middleware (authenticateToken, authorizeRoles)"]
        
        subgraph Modules["API Modules"]
            M_AUTH["Auth Module (/api/auth)"]
            M_USERS["Users Module (/api/users)"]
            M_SKILLS["Skills Module (/api/skills)"]
            M_ADMIN["Admin Module (/api/admin)"]
            M_JOBS["Jobs Module (Phase 2 - Handover)"]
        end
        
        ERR_MW["Centralized Error Middleware"]
        
        APP --> AUTH_MW
        AUTH_MW --> M_AUTH
        AUTH_MW --> M_USERS
        AUTH_MW --> M_SKILLS
        AUTH_MW --> M_ADMIN
        AUTH_MW -.-> M_JOBS
        Modules --> ERR_MW
    end

    subgraph Database["Data Tier (PostgreSQL 16+)"]
        PRISMA["Prisma Client 7 (pg Pool Adapter)"]
        PG_DB[("PostgreSQL Database\nalumni_connect")]
        
        Modules --> PRISMA
        PRISMA --> PG_DB
    end

    API_SVC -- "HTTP / JSON (HttpOnly Cookie)" --> APP
```

---

## 📁 Repository & Directory Structure

```text
alumni-connect/
├── docs/
│   └── MEMBER_2_HANDOVER.md        # Dedicated handover specification for Member 2
├── client/                          # React 19 Frontend Application
│   ├── public/                      # Static assets & favicon
│   ├── src/
│   │   ├── assets/                  # Branding graphics and SVGs
│   │   ├── components/
│   │   │   ├── common/              # Button, Card, Input, Select, Textarea, Loading, ErrorAlert, ProtectedRoute
│   │   │   ├── dashboard/           # StatCard, ActivityFeed
│   │   │   └── navigation/          # Navbar, Sidebar, Footer
│   │   ├── context/                 # AuthContext & AuthProvider
│   │   ├── hooks/                   # useAuth hook
│   │   ├── layouts/                 # MainLayout, DashboardLayout, AuthLayout
│   │   ├── pages/
│   │   │   ├── admin/               # AdminDashboard.jsx
│   │   │   ├── alumni/              # AlumniDashboard.jsx
│   │   │   ├── auth/                # LoginPage.jsx, RegisterPage.jsx
│   │   │   ├── profile/             # ProfilePage.jsx
│   │   │   ├── student/             # StudentDashboard.jsx
│   │   │   └── NotFoundPage.jsx     # 404 handler
│   │   ├── services/
│   │   │   ├── api.js               # Central fetch client with credentials: 'include'
│   │   │   ├── authService.js       # Authentication service
│   │   │   ├── userService.js       # Profile & skill API service
│   │   │   └── adminService.js      # Admin management service
│   │   ├── styles/
│   │   │   ├── tokens.css           # Design tokens: palette, typography, elevation, spacing
│   │   │   └── global.css           # Global resets and utilities
│   │   ├── utils/                   # getDefaultDashboardPath helper
│   │   ├── App.jsx                  # Application routes and role protections
│   │   └── main.jsx                 # Client entry point
│   ├── .env.example                 # Frontend env template
│   ├── package.json
│   └── vite.config.js
├── server/                          # Express Backend Application
│   ├── prisma/
│   │   ├── migrations/
│   │   │   └── 20261107083835_init/ # Baseline migration (10 models + 7 enums)
│   │   ├── seed.js                  # Idempotent administrator seed script
│   │   └── schema.prisma            # Prisma ORM schema
│   ├── prisma.config.ts             # Prisma 7 datasource & migration configuration
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Reusable PrismaClient instance with @prisma/adapter-pg
│   │   │   └── index.js             # Environment variable validation & loader
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # authenticateToken & authorizeRoles
│   │   │   ├── errorMiddleware.js   # Centralized error handler
│   │   │   └── notFoundMiddleware.js# 404 handler
│   │   ├── modules/
│   │   │   ├── admin/               # admin.controller.js, admin.routes.js
│   │   │   ├── auth/                # auth.controller.js, auth.routes.js
│   │   │   ├── skills/              # skills.controller.js, skills.routes.js
│   │   │   └── users/               # users.controller.js, users.routes.js
│   │   ├── app.js                   # Express pipeline configuration
│   │   └── server.js                # Server entry point & graceful shutdown
│   ├── .env.example                 # Backend env template
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🗄 Database Architecture & Data Models

Managed via **Prisma ORM 7** on **PostgreSQL 16+**. All 10 models and 7 enums exist in `schema.prisma` and are fully migrated under migration `20261107083835_init`.

### Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o| Profile : "1-to-1"
    User ||--o{ UserSkill : "has many"
    Skill ||--o{ UserSkill : "assigned to"
    User ||--o{ JobPost : "posts (ALUMNI)"
    JobPost ||--o{ JobReferral : "has"
    User ||--o{ JobReferral : "requests (STUDENT)"
    User ||--o{ JobReferral : "reviews (ALUMNI)"
    User ||--o{ MentorshipSlot : "hosts (ALUMNI)"
    MentorshipSlot ||--o{ MentorshipRequest : "scheduled via"
    User ||--o{ MentorshipRequest : "requests (STUDENT)"
    User ||--o{ Event : "organizes"
    Event ||--o{ EventRegistration : "has"
    User ||--o{ EventRegistration : "attends"
```

### Models Detail

#### 1. `User` (Phase 1)
Core authentication and authorization entity.
- `id` (`Int`, Primary Key, autoincrement)
- `name` (`String`)
- `email` (`String`, Unique, indexed)
- `passwordHash` (`String`)
- `role` (`Role`: `STUDENT`, `ALUMNI`, `ADMIN`, default `STUDENT`, indexed)
- `isActive` (`Boolean`, default `true`)
- `createdAt` (`DateTime`, default `now()`)
- `updatedAt` (`DateTime`, auto-updated)

#### 2. `Profile` (Phase 1)
Extended academic and career portfolio (1-to-1 with `User`).
- `id` (`Int`, Primary Key, autoincrement)
- `userId` (`Int`, Unique, Foreign Key -> `User.id`, Cascade Delete)
- `college` (`String?`)
- `branch` (`String?`)
- `batch` (`String?`)
- `graduationYear` (`Int?`)
- `bio` (`String?`)
- `company` (`String?`)
- `designation` (`String?`)
- `industry` (`String?`)
- `careerGoals` (`String?`)
- `linkedinUrl` (`String?`)
- `createdAt`, `updatedAt`

#### 3. `Skill` (Phase 1)
Master taxonomy of technical and domain skills.
- `id` (`Int`, Primary Key, autoincrement)
- `name` (`String`, Unique)

#### 4. `UserSkill` (Phase 1)
Explicit join entity linking Users to Skills.
- `id` (`Int`, Primary Key, autoincrement)
- `userId` (`Int`, Foreign Key -> `User.id`, Cascade Delete)
- `skillId` (`Int`, Foreign Key -> `Skill.id`, Cascade Delete)
- `createdAt` (`DateTime`, default `now()`)
- `@@unique([userId, skillId])` (Prevents duplicate skill assignments)

#### 5. `JobPost` (Pre-architected for Member 2)
Opportunities posted by Alumni.
- `id` (`Int`, Primary Key, autoincrement)
- `title` (`String`), `description` (`String`), `company` (`String`, indexed), `location` (`String`)
- `employmentType` (`EmploymentType`: `FULL_TIME`, `PART_TIME`, `INTERNSHIP`, `CONTRACT`, `REMOTE`)
- `experienceLevel` (`ExperienceLevel`: `ENTRY`, `MID`, `SENIOR`, `LEAD`)
- `applicationUrl` (`String?`), `deadline` (`DateTime?`, indexed)
- `postedById` (`Int`, Foreign Key -> `User.id`, indexed)

#### 6. `JobReferral` (Pre-architected for Member 2)
Referral requests submitted by Students to Alumni.
- `id` (`Int`, Primary Key, autoincrement)
- `studentId` (`Int`, Foreign Key -> `User.id`, indexed)
- `alumniId` (`Int`, Foreign Key -> `User.id`, indexed)
- `jobPostId` (`Int`, Foreign Key -> `JobPost.id`, indexed)
- `message` (`String?`)
- `status` (`ReferralStatus`: `PENDING`, `REVIEWED`, `ACCEPTED`, `REJECTED`, default `PENDING`, indexed)
- `@@unique([studentId, jobPostId])` (Enforces 1 referral submission per student per job)

#### 7. `MentorshipSlot` (Pre-architected for Member 3)
Office hour slots published by Alumni.
- `id` (`Int`, Primary Key, autoincrement)
- `alumniId` (`Int`, Foreign Key -> `User.id`, indexed)
- `topic` (`String`), `description` (`String?`), `expertise` (`String?`)
- `startTime` (`DateTime`, indexed), `endTime` (`DateTime`)
- `status` (`MentorshipSlotStatus`: `AVAILABLE`, `BOOKED`, `COMPLETED`, `CANCELLED`, default `AVAILABLE`, indexed)

#### 8. `MentorshipRequest` (Pre-architected for Member 3)
Student session booking requests.
- `id` (`Int`, Primary Key, autoincrement)
- `studentId` (`Int`, Foreign Key -> `User.id`, indexed)
- `slotId` (`Int`, Foreign Key -> `MentorshipSlot.id`, indexed)
- `message` (`String?`)
- `status` (`MentorshipRequestStatus`: `PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, default `PENDING`, indexed)
- `@@unique([studentId, slotId])`

#### 9. `Event` (Pre-architected for Member 3)
Campus workshops, reunions, and webinars.
- `id` (`Int`, Primary Key, autoincrement)
- `title` (`String`), `description` (`String`), `category` (`EventCategory`: `WEBINAR`, `WORKSHOP`, `REUNION`, etc., indexed)
- `location` (`String`), `eventType` (`EventType`: `VIRTUAL`, `IN_PERSON`, `HYBRID`)
- `startDate` (`DateTime`, indexed), `endDate` (`DateTime`), `registrationDeadline` (`DateTime?`), `capacity` (`Int?`)
- `organizerId` (`Int`, Foreign Key -> `User.id`, indexed)

#### 10. `EventRegistration` (Pre-architected for Member 3)
Attendee registrations.
- `id` (`Int`, Primary Key, autoincrement)
- `eventId` (`Int`, Foreign Key -> `Event.id`, indexed)
- `userId` (`Int`, Foreign Key -> `User.id`, indexed)
- `status` (`RegistrationStatus`: `REGISTERED`, `ATTENDED`, `CANCELLED`, default `REGISTERED`, indexed)
- `registeredAt` (`DateTime`, default `now()`)
- `@@unique([eventId, userId])`

### How to Extend the Database in Future Phases
If you add columns or tables:
1. Update `server/prisma/schema.prisma`.
2. Generate a migration: `npx prisma migrate dev --name <migration_name>` in `server/`.
3. Regenerate client: `npx prisma generate`.

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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/alumni_connect?schema=public"
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@alumniconnect.edu
ADMIN_PASSWORD=Admin@Secure2026!
```

> [!NOTE]
> On macOS with Homebrew PostgreSQL, `DATABASE_URL` can also be formatted as:  
> `postgresql://$(whoami)@localhost:5432/alumni_connect?schema=public`

### Frontend Environment (`client/.env`)
Create `client/.env` based on `client/.env.example`:
```env
VITE_API_URL=http://localhost:5001/api
```

---

## 🐘 PostgreSQL & Prisma Setup

1. **Create the database in PostgreSQL:**
   ```bash
   createdb alumni_connect
   # Or via psql:
   # psql -U postgres -c "CREATE DATABASE alumni_connect;"
   ```

2. **Run Prisma Migrations:**
   ```bash
   cd server
   npm install
   npx prisma migrate dev
   npx prisma generate
   ```

---

## 🛡 Administrative Account Seeding

The server includes an idempotent seed script to create the initial System Administrator.

```bash
cd server
npm run seed
```

**Default Admin Credentials:**
- **Email:** `admin@alumniconnect.edu`
- **Password:** `Admin@Secure2026!`
- **Role:** `ADMIN`

---

## ⚡ Execution Commands

### Run Backend Server (Express API)
```bash
cd server
npm run dev
# Starts on http://localhost:5001 with nodemon auto-reload
```

### Run Frontend Client (Vite React)
```bash
cd client
npm run dev
# Starts on http://localhost:5173 with HMR
```

### Run Code Quality & Verification
```bash
# In client directory:
npm run lint    # Runs oxlint
npm run build   # Validates production Vite build
```

---

## 📡 Complete API Documentation

Base URL: `http://localhost:5001/api`

### 1. Health Endpoint
#### `GET /health`
- **Authentication:** Public
- **Allowed Roles:** Any
- **Request Body:** None
- **Query Parameters:** None
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "AlumniConnect API is running",
    "timestamp": "2026-11-09T00:00:00.000Z"
  }
  ```

---

### 2. Authentication Module (`/auth`)

#### `POST /auth/register`
- **Authentication:** Public
- **Allowed Roles:** Public (Payload restricted to `STUDENT` or `ALUMNI`)
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@alumni.edu",
    "password": "Password123!",
    "role": "STUDENT"
  }
  ```
- **Success Response (201 Created):**
  *(Sets `HttpOnly` cookie named `token`)*
  ```json
  {
    "success": true,
    "message": "Registration successful.",
    "user": {
      "id": 4,
      "name": "Jane Doe",
      "email": "jane@alumni.edu",
      "role": "STUDENT",
      "isActive": true
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Validation failure (weak password, missing fields, invalid role).
  - `409 Conflict`: `Email is already registered.`

#### `POST /auth/login`
- **Authentication:** Public
- **Allowed Roles:** Any
- **Request Body:**
  ```json
  {
    "email": "jane@alumni.edu",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK):**
  *(Sets `HttpOnly` cookie named `token`)*
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "user": {
      "id": 4,
      "name": "Jane Doe",
      "email": "jane@alumni.edu",
      "role": "STUDENT",
      "isActive": true
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`: `Invalid email or password.`
  - `403 Forbidden`: `Account has been deactivated. Please contact administration.`

#### `POST /auth/logout`
- **Authentication:** Public
- **Allowed Roles:** Any
- **Request Body:** None
- **Success Response (200 OK):**
  *(Clears `token` cookie)*
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```

#### `GET /auth/me`
- **Authentication:** Required (Cookie or `Authorization: Bearer <token>`)
- **Allowed Roles:** Any authenticated user
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "userId": 4,
      "email": "jane@alumni.edu",
      "role": "STUDENT"
    }
  }
  ```
- **Error Response:**
  - `401 Unauthorized`: Missing or expired token.

---

### 3. User & Profile Management Module (`/users`)

#### `GET /users/me`
- **Authentication:** Required
- **Allowed Roles:** `STUDENT`, `ALUMNI`, `ADMIN`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "user": {
      "id": 4,
      "name": "Jane Doe",
      "email": "jane@alumni.edu",
      "role": "STUDENT",
      "isActive": true,
      "profile": {
        "college": "School of Engineering",
        "branch": "Computer Science",
        "batch": "2022-2026",
        "graduationYear": 2026,
        "bio": "Aspiring Cloud Architect",
        "company": null,
        "designation": null,
        "industry": "Software Engineering",
        "careerGoals": "Distributed Systems",
        "linkedinUrl": "https://linkedin.com/in/janedoe"
      },
      "skills": [
        { "id": 1, "name": "React" },
        { "id": 2, "name": "Node.js" }
      ]
    }
  }
  ```

#### `PUT /users/me`
- **Authentication:** Required
- **Allowed Roles:** Any authenticated user
- **Request Body:**
  ```json
  {
    "name": "Jane Doe Updated",
    "college": "School of Engineering",
    "branch": "Computer Science",
    "batch": "2022-2026",
    "graduationYear": 2026,
    "bio": "Updated bio statement",
    "company": "Tech Corp",
    "designation": "Software Intern",
    "industry": "Cloud Computing",
    "careerGoals": "Full Stack Mastery",
    "linkedinUrl": "https://linkedin.com/in/janedoe-updated"
  }
  ```
- **Success Response (200 OK):** Returns updated user, profile, and skills.

#### `GET /users/:id`
- **Authentication:** Public
- **Allowed Roles:** Any
- **Success Response (200 OK):** Returns sanitized public profile and skill tags for user ID `:id`.
- **Error Response:** `404 Not Found`: User not found.

#### `POST /users/me/skills`
- **Authentication:** Required
- **Allowed Roles:** Any authenticated user
- **Request Body:** Either `{ "name": "TypeScript" }` or `{ "skillId": 3 }`
- **Success Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Skill added successfully.",
    "skill": {
      "skillId": 3,
      "userSkillId": 7,
      "name": "typescript"
    }
  }
  ```
- **Error Response:** `409 Conflict`: Skill is already attached to user profile.

#### `DELETE /users/me/skills/:skillId`
- **Authentication:** Required
- **Allowed Roles:** Any authenticated user
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Skill removed from profile successfully."
  }
  ```
- **Error Response:** `404 Not Found`: Skill association does not exist.

---

### 4. Skills Catalog Module (`/skills`)

#### `GET /skills`
- **Authentication:** Public
- **Query Parameters:** `search` (optional substring query)
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "skills": [
      { "id": 1, "name": "react" },
      { "id": 2, "name": "node.js" },
      { "id": 3, "name": "typescript" }
    ]
  }
  ```

---

### 5. Administrative Oversight Module (`/admin`)

#### `GET /admin/users`
- **Authentication:** Required
- **Allowed Roles:** `ADMIN` only
- **Query Parameters:** `role`, `isActive`, `search`, `page = 1`, `limit = 10`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "pages": 5
    },
    "users": [ ... ]
  }
  ```

#### `GET /admin/users/:id`
- **Authentication:** Required
- **Allowed Roles:** `ADMIN` only
- **Success Response (200 OK):** Detailed user audit object including relational counts (`_count` for jobPosts, referrals, mentorshipSlots, etc.).

#### `PATCH /admin/users/:id/status`
- **Authentication:** Required
- **Allowed Roles:** `ADMIN` only
- **Request Body:** `{ "isActive": false }`
- **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "User account deactivated successfully.",
    "user": { "id": 15, "email": "...", "isActive": false }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Attempting to deactivate your own administrator account or another administrator account.
  - `404 Not Found`: Target user ID does not exist.

---

## 🔒 Authentication & Session Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Client as React App (Vite)
    participant Server as Express Backend
    participant DB as PostgreSQL (Prisma)

    User->>Client: Submit Login Form (email, password)
    Client->>Server: POST /api/auth/login { email, password }
    Server->>DB: Query User by email
    DB-->>Server: Return User record
    Server->>Server: bcrypt.compare(password, passwordHash)
    Server->>Server: jwt.sign({ userId, email, role })
    Server-->>Client: HTTP 200 OK + Set-Cookie: token=JWT; HttpOnly; SameSite=Lax
    Client->>Server: GET /api/users/me (credentials: 'include')
    Server->>DB: Fetch user profile and skills
    DB-->>Server: Profile data
    Server-->>Client: User & Profile JSON
    Client->>User: Route to Role Dashboard
```

1. **Storage:** JWTs are stored exclusively in an `HttpOnly` cookie named `token`. Frontend JavaScript cannot read `document.cookie`, safeguarding against XSS token harvesting.
2. **Persistence:** On page load or reload, `AuthProvider` automatically calls `GET /api/auth/me`. If a valid cookie exists, the session restores seamlessly.
3. **Cross-Site Configuration:** The server uses `SameSite: 'lax'` to prevent cross-site request forgery while permitting top-level navigation.

---

## 🛡 Role-Based Access Control (RBAC) Matrix

| Feature / Endpoint | `STUDENT` | `ALUMNI` | `ADMIN` | Public / Unauth |
|---|:---:|:---:|:---:|:---:|
| System Health (`GET /health`) | ✅ | ✅ | ✅ | ✅ |
| Public Register (`POST /auth/register`) | ✅ | ✅ | ❌ | ✅ |
| Login / Logout | ✅ | ✅ | ✅ | ✅ |
| View Own Profile (`GET /users/me`) | ✅ | ✅ | ✅ | ❌ |
| Update Own Profile (`PUT /users/me`) | ✅ | ✅ | ✅ | ❌ |
| Manage Own Skills (`POST/DELETE /users/me/skills`) | ✅ | ✅ | ✅ | ❌ |
| Public User Lookup (`GET /users/:id`) | ✅ | ✅ | ✅ | ✅ |
| Skills Taxonomy (`GET /skills`) | ✅ | ✅ | ✅ | ✅ |
| Student Dashboard (`/student/dashboard`) | ✅ | ❌ | ❌ | ❌ |
| Alumni Dashboard (`/alumni/dashboard`) | ❌ | ✅ | ❌ | ❌ |
| Admin Dashboard (`/admin/dashboard`) | ❌ | ❌ | ✅ | ❌ |
| Admin Directory API (`GET /admin/users`) | ❌ | ❌ | ✅ | ❌ |
| Admin Status API (`PATCH /admin/users/:id/status`)| ❌ | ❌ | ✅ | ❌ |
| Post Job Listing *(Phase 2 Scope)* | ❌ | ✅ | ✅ | ❌ |
| Request Referral *(Phase 2 Scope)* | ✅ | ❌ | ❌ | ❌ |
| Host Mentorship Slots *(Phase 3 Scope)* | ❌ | ✅ | ❌ | ❌ |
| Book Mentorship Slot *(Phase 3 Scope)* | ✅ | ❌ | ❌ | ❌ |

---

## 🧪 Quality Assurance & Verification

The project includes an automated end-to-end QA validation script executing 27 integration tests across 3 testing sections:
1. **Section A: Backend Functionality** (Registration, validation, login, duplicate detection, logout, profile update, skills management, admin directory).
2. **Section B: Authorization Boundaries** (Students/Alumni blocked from `/admin/*`, unauthenticated blocked from protected routes, user profile edit isolation, admin self-deactivation protection, admin registration tampering prevention).
3. **Section C: Security & Resilience** (Expired/malformed cookie rejection, SQL injection evasion in search parameters, XSS tag sanitization).

**Current Test Status:** `27 / 27 PASSED (100% Pass Rate)`.  
**Frontend Linter Status:** `0 warnings, 0 errors` via `oxlint`.

---

## 🗺 Future Development Modules & Roadmap

### Phase 2: Member 2 Responsibility
> Detailed step-by-step guidance is available in [`docs/MEMBER_2_HANDOVER.md`](docs/MEMBER_2_HANDOVER.md).

1. **Job Board (`JobPost` Module):**
   - Alumni post opportunities (`POST /api/jobs`).
   - Filterable search by employment type, experience, and company (`GET /api/jobs`).
   - Job details view with poster information (`GET /api/jobs/:id`).
   - Alumni job owner edit/delete capabilities (`PUT /api/jobs/:id`, `DELETE /api/jobs/:id`).
2. **Referral Engine (`JobReferral` Module):**
   - Students request referrals (`POST /api/jobs/:id/referrals`) with duplicate submission prevention.
   - Alumni referral review dashboard (`GET /api/alumni/referrals`).
   - Student referral tracking dashboard (`GET /api/student/referrals`).
   - Referral decision workflow (`PATCH /api/referrals/:id/status`: `ACCEPTED`, `REJECTED`, `REVIEWED`).
3. **Intelligent Student-Job Matching Algorithm:**
   - Skill overlap comparison ($S_{\text{skills}}$).
   - Academic department/branch alignment ($S_{\text{branch}}$).
   - Weighted match score computation and UI badge rendering.

---

### Phase 3: Member 3 Responsibility
1. **1-on-1 Mentorship Scheduling:**
   - Alumni publish weekly availability slots (`MentorshipSlot`).
   - Students browse calendar slots and submit booking requests (`MentorshipRequest`).
   - Alumni accept or decline sessions.
2. **Campus Events & Webinars:**
   - University administrators and alumni organize virtual/in-person workshops (`Event`).
   - Students and alumni register for sessions with capacity caps (`EventRegistration`).
3. **Notification Engine:**
   - Real-time in-app alerts and email notifications for referral responses and mentorship confirmations.

---

## 📜 Team Git Commit History

All milestones have been systematically committed to `main`:

| Commit Hash | Stage | Description |
|---|:---:|---|
| `ac64047` | 1 | `chore: initialize project structure and tooling` |
| `590df2a` | 2 | `feat: configure PostgreSQL and Prisma schema` |
| `afdde65` | 3 | `feat: setup Express server and middleware` |
| `38db0f7` | 4 | `feat: implement JWT authentication and RBAC` |
| `0700a4a` | 5 | `feat: implement user and profile management APIs` |
| `b62efb9` | 6 | `feat: setup React frontend and design system` |
| `f1cc03a` | 7 | `feat: implement registration and login interface` |
| `788a983` | 8 | `feat: implement profile pages and role dashboards` |
| `e1d7669` | 9 | `docs: update project documentation and team handover roadmap` |
| `06e8ce6` | 10 | `test: integrate and validate authentication and profiles` |
| *Current* | 11 | `docs: complete project documentation and handover` |
