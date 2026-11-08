# AlumniConnect

**Intelligent Platform to Interconnect Alumni and Students.**

AlumniConnect is an enterprise-grade university networking platform designed to foster meaningful engagement between students, alumni, and campus administration. The platform bridges collegiate ambition with professional excellence through structured 1-on-1 mentorship, direct internal job referrals, profile showcase, and institutional governance.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite 8, React Router v7, Vanilla CSS with custom Design Tokens, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL 16+
- **ORM**: Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- **Authentication**: JWT-based Authentication using secure, HttpOnly, SameSite cookies & bcrypt password hashing
- **Role-Based Access Control (RBAC)**: `STUDENT`, `ALUMNI`, `ADMIN`
- **Linting & Quality**: `oxlint` (Zero errors, zero warnings across all modules)
- **Version Control**: Git & GitHub

---

## 📁 Repository Structure

```text
alumni-connect/
├── client/                     # Frontend Application (React 19 + Vite 8 + React Router)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── assets/             # Branding icons and graphics
│   │   ├── components/
│   │   │   ├── common/         # Button, Card, Input, Select, Textarea, Loading, ErrorAlert, ProtectedRoute
│   │   │   ├── dashboard/      # StatCard, ActivityFeed
│   │   │   └── navigation/     # Navbar, Sidebar, Footer
│   │   ├── context/            # AuthContext, AuthProvider, authContextInstance
│   │   ├── hooks/              # useAuth hook
│   │   ├── layouts/            # MainLayout, DashboardLayout, AuthLayout
│   │   ├── pages/
│   │   │   ├── auth/           # LoginPage, RegisterPage
│   │   │   ├── student/        # StudentDashboard (live profile, completion meter, module placeholders)
│   │   │   ├── alumni/         # AlumniDashboard (live company info, skills, module placeholders)
│   │   │   ├── admin/          # AdminDashboard (live user directory, account status toggles)
│   │   │   ├── profile/        # ProfilePage (view/edit tabs, live profile PUT, skills add/remove)
│   │   │   └── NotFoundPage    # Clean 404 handler
│   │   ├── services/
│   │   │   ├── api.js          # Reusable fetch client with credentials: 'include'
│   │   │   ├── authService.js  # register, login, logout, getCurrentUser (/api/auth)
│   │   │   ├── userService.js  # getMyProfile, updateMyProfile, addSkill, removeSkill (/api/users)
│   │   │   └── adminService.js # getUsers, getUserById, updateUserStatus (/api/admin)
│   │   ├── styles/             # tokens.css (color palette, typography, radii, elevation), global.css
│   │   ├── utils/              # navigation helpers (getDefaultDashboardPath)
│   │   ├── App.jsx             # Top-level Router & ProtectedRoute tree
│   │   └── main.jsx            # Entry point
│   ├── .env.example            # VITE_API_URL template
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend API (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── migrations/         # Applied PostgreSQL SQL migrations
│   │   └── schema.prisma       # Prisma schema (10 comprehensive models)
│   ├── prisma.config.ts        # Prisma 7 configuration (datasource URL & migrations)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js     # PrismaClient singleton with pg adapter
│   │   │   └── index.js        # Environment config loader
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js # authenticateToken & authorizeRoles (RBAC)
│   │   │   ├── errorMiddleware.js# Centralized error handler
│   │   │   └── notFoundMiddleware.js # 404 JSON handler
│   │   ├── modules/
│   │   │   ├── auth/           # register, login, logout, me
│   │   │   ├── users/          # me, updateMe, getUserById, addSkill, removeSkill
│   │   │   ├── skills/         # getSkills catalog
│   │   │   └── admin/          # listUsers, getUserDetails, updateStatus
│   │   ├── app.js              # Express app pipeline, CORS, cookie-parser
│   │   └── server.js           # Server listen & graceful shutdown
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🗄 Database Architecture & Models

The PostgreSQL database is managed with **Prisma ORM 7** and contains 10 core relational models:

| Model | Purpose | Key Attributes |
|---|---|---|
| **`User`** | Platform user accounts | `id`, `name`, `email` (unique), `passwordHash`, `role` (`STUDENT`, `ALUMNI`, `ADMIN`), `isActive`, `createdAt`, `updatedAt` |
| **`Profile`** | 1-to-1 extended academic & career profile | `userId` (unique), `college`, `branch`, `batch`, `graduationYear`, `bio`, `company`, `designation`, `industry`, `careerGoals`, `linkedinUrl` |
| **`Skill`** | Canonical catalog of technical & domain skills | `id`, `name` (case-insensitive unique) |
| **`UserSkill`** | Explicit join model linking Users to Skills | `userId`, `skillId`, `@@unique([userId, skillId])` to prevent duplicate assignments |
| **`JobPost`** | Hiring and internship listings posted by Alumni | `title`, `description`, `company`, `location`, `employmentType`, `experienceLevel`, `applicationUrl`, `deadline`, `postedById` |
| **`JobReferral`** | Warm referral requests submitted by Students to Alumni | `studentId`, `alumniId`, `jobPostId`, `message`, `status` (`PENDING`, `REVIEWED`, `ACCEPTED`, `REJECTED`), `@@unique([studentId, jobPostId])` |
| **`MentorshipSlot`**| Office-hour availability slots published by Alumni | `alumniId`, `topic`, `description`, `expertise`, `startTime`, `endTime`, `status` (`AVAILABLE`, `BOOKED`, `COMPLETED`, `CANCELLED`) |
| **`MentorshipRequest`**| 1-on-1 booking requests submitted by Students | `studentId`, `slotId`, `message`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`), `@@unique([studentId, slotId])` |
| **`Event`** | Institutional workshops, webinars, and reunions | `title`, `description`, `category`, `location`, `eventType` (`VIRTUAL`, `IN_PERSON`, `HYBRID`), `startDate`, `endDate`, `capacity`, `organizerId` |
| **`EventRegistration`**| Attendees registered for campus events | `eventId`, `userId`, `status` (`REGISTERED`, `ATTENDED`, `CANCELLED`), `registeredAt`, `@@unique([eventId, userId])` |

---

## 📡 Live API Specifications

### 1. Health & Discovery
- `GET /api/health` — System uptime and API verification.

### 2. Authentication (`/api/auth`)
- `POST /api/auth/register` — Public registration (strictly `STUDENT` or `ALUMNI`). Validates password strength (>= 8 chars, uppercase, lowercase, number). Auto-creates empty profile record and sets HttpOnly cookie.
- `POST /api/auth/login` — Authenticates credentials, generates signed JWT, and sets secure HttpOnly cookie.
- `POST /api/auth/logout` — Terminates authenticated session and clears the cookie.
- `GET /api/auth/me` — Authenticated session check returning `req.user`.

### 3. User & Profile Management (`/api/users`)
- `GET /api/users/me` — Returns the logged-in user's profile and skills array.
- `PUT /api/users/me` — Updates profile fields (college, branch, batch, graduationYear, bio, company, designation, industry, careerGoals, linkedinUrl) and user name.
- `GET /api/users/:id` — Public discovery returning safe profile information (excluding passwords/tokens).
- `POST /api/users/me/skills` — Attaches a skill to the user's profile (accepts `{ name: "React" }` or `{ skillId: 1 }`).
- `DELETE /api/users/me/skills/:skillId` — Removes a skill association from the user's profile.

### 4. Skills Catalog (`/api/skills`)
- `GET /api/skills` — Searchable canonical skill catalog (`?search=query`).

### 5. Administrative Oversight (`/api/admin`)
- `GET /api/admin/users` — Paginated and filtered user directory (`?role=STUDENT&isActive=true&search=...`).
- `GET /api/admin/users/:id` — Detailed user audit profile with relation counts.
- `PATCH /api/admin/users/:id/status` — Toggles active account status (`{ isActive: boolean }`). Protected against self-deactivation and admin lockouts.

---

## 🚀 Setup & Development Instructions

### Prerequisites
- **Node.js**: `v20+` or `v25+`
- **npm**: `v9+` or `v11+`
- **PostgreSQL**: `v14+` or `v16+` running on port `5432`
- **Git**

### Backend Setup (`server/`)
```bash
cd server
npm install
cp .env.example .env
# Ensure DATABASE_URL in .env points to your local PostgreSQL instance
npx prisma migrate dev
npx prisma generate
npm run seed     # Seeds default Administrator: admin@alumniconnect.edu / Admin@Secure2026!
npm run dev      # Runs Express backend on http://localhost:5001
```

### Frontend Setup (`client/`)
```bash
cd client
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:5001/api
npm run dev      # Runs Vite development server on http://localhost:5173
```

---

## 👥 Team Development Status & Handover

### Completed by Member 1
1. `ac64047` — `chore: initialize project structure and tooling`
2. `590df2a` — `feat: configure PostgreSQL and Prisma schema`
3. `afdde65` — `feat: setup Express server and middleware`
4. `38db0f7` — `feat: implement JWT authentication and RBAC`
5. `0700a4a` — `feat: implement user and profile management APIs`
6. `b62efb9` — `feat: setup React frontend and design system`
7. `f1cc03a` — `feat: implement registration and login interface`
8. `788a983` — `feat: implement profile pages and role dashboards`

### Handover Roadmap for Team Members

#### 💼 Member 2: Job Board & Referral Engine
- **Models to utilize**: `JobPost`, `JobReferral` (already migrated in schema).
- **Backend APIs to implement**:
  - `POST /api/jobs` — Alumni posts new job/internship.
  - `GET /api/jobs` — Browse open positions with branch/skill filters.
  - `POST /api/jobs/:id/referrals` — Students request an internal referral.
  - `GET /api/alumni/referrals` — Alumni reviews and updates student referral request status (`ACCEPTED`, `REJECTED`).
- **Frontend Pages to integrate**:
  - Replace the Phase 2 placeholder in `StudentDashboard` and `AlumniDashboard` with the live Job Board and Referral Manager.

#### 🤝 Member 3: 1-on-1 Mentorship & Matching Engine
- **Models to utilize**: `MentorshipSlot`, `MentorshipRequest`, `Event`, `EventRegistration`.
- **Backend APIs to implement**:
  - `POST /api/mentorship/slots` — Alumni publishes weekly availability slots.
  - `GET /api/mentorship/slots` — Students browse available mentor office hours.
  - `POST /api/mentorship/slots/:id/book` — Students book a mentorship slot.
  - `GET /api/alumni/mentorship/requests` — Alumni accepts or declines mentee session requests.
  - Matching algorithm matching students with alumni sharing common skills or branches.
- **Frontend Pages to integrate**:
  - Replace the Phase 3 placeholder in `StudentDashboard` and `AlumniDashboard` with the live Mentorship Calendar and Booking interface.
