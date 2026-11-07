# AlumniConnect

Intelligent Platform to Interconnect Alumni and Students.

AlumniConnect is a web platform designed to foster meaningful engagement between students, alumni, and college administrators. The platform supports professional networking, intelligent alumni-student mentorship matching, job and referral postings, and institutional event coordination.

---

## 🛠 Tech Stack

- **Frontend**: React.js with Vite, HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL 16+
- **ORM**: Prisma ORM 7 (`@prisma/client`, `@prisma/adapter-pg`, `pg`)
- **Authentication**: JWT-based Authentication (planned for Phase 3)
- **Version Control**: Git & GitHub

---

## 📁 Project Structure

```text
alumni-connect/
├── client/                     # Frontend application (React + Vite)
│   ├── public/                 # Static public assets
│   ├── src/
│   │   ├── assets/             # Images, SVGs, and static media
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Application views / routed pages
│   │   ├── layouts/            # Page layout wrappers (Navbar, Sidebar, etc.)
│   │   ├── services/           # API integration and HTTP clients
│   │   ├── context/            # Global React Context providers
│   │   ├── hooks/              # Custom React hooks
│   │   └── styles/             # Global stylesheets and styling modules
│   ├── .env.example            # Frontend environment variable template
│   ├── package.json            # Frontend dependencies and scripts
│   └── vite.config.js          # Vite build configuration
├── server/                     # Backend API application (Node.js + Express + Prisma)
│   ├── prisma/                 # Prisma ORM schema and database migrations
│   │   ├── migrations/         # Applied SQL migrations
│   │   └── schema.prisma       # Database schema definition
│   ├── prisma.config.ts        # Prisma 7 configuration (datasource connection & migration path)
│   ├── src/
│   │   ├── config/             # Environment, runtime & Prisma DB configuration
│   │   │   ├── database.js     # Reusable Prisma client instance with PostgreSQL driver adapter
│   │   │   └── index.js        # Environment configuration loader
│   │   ├── middleware/         # Custom Express middlewares (auth, error handling, 404)
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   └── notFoundMiddleware.js
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/           # Authentication & session endpoints
│   │   │   ├── users/          # Profile management & public discovery
│   │   │   ├── skills/         # Catalog of canonical platform skills
│   │   │   └── admin/          # Administrative user management & oversight
│   │   ├── utils/              # Helper and utility functions
│   │   ├── app.js              # Express app configuration & middleware pipeline
│   │   └── server.js           # Server entry point & graceful shutdown listener
│   ├── .env.example            # Backend environment variable template
│   └── package.json            # Backend dependencies and scripts
├── .gitignore                  # Git ignore rules for node_modules, build, and env files
└── README.md                   # Project documentation
```

---

## 🗄 Database Architecture & Prisma Schema

The application database is powered by **PostgreSQL** and managed using **Prisma ORM 7**.

### Models Overview

| Model | Purpose | Key Attributes |
|---|---|---|
| **`User`** | System accounts for Students, Alumni, and Admins | `id`, `name`, `email` (unique), `passwordHash`, `role` (`STUDENT`, `ALUMNI`, `ADMIN`), `isActive`, timestamps |
| **`Profile`** | Academic and career profile details (1-to-1 with User) | `college`, `branch`, `batch`, `graduationYear`, `bio`, `company`, `designation`, `industry`, `careerGoals`, `linkedinUrl` |
| **`Skill`** | Canonical catalog of technical and domain skills | `id`, `name` (unique) |
| **`UserSkill`** | Explicit join model linking Users to Skills | `userId`, `skillId`, `@@unique([userId, skillId])` to prevent duplicate assignments |
| **`JobPost`** | Job and internship opportunities posted by Alumni | `title`, `description`, `company`, `location`, `employmentType`, `experienceLevel`, `applicationUrl`, `deadline`, `postedById` |
| **`JobReferral`** | Referral requests submitted by Students to Alumni for specific Job Posts | `studentId`, `alumniId`, `jobPostId`, `message`, `status` (`PENDING`, `REVIEWED`, `ACCEPTED`, `REJECTED`), `@@unique([studentId, jobPostId])` |
| **`MentorshipSlot`** | Time slots published by Alumni offering 1-on-1 mentorship sessions | `alumniId`, `topic`, `description`, `expertise`, `startTime`, `endTime`, `status` (`AVAILABLE`, `BOOKED`, `COMPLETED`, `CANCELLED`) |
| **`MentorshipRequest`** | Student booking requests for specific Mentorship Slots | `studentId`, `slotId`, `message`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`), `@@unique([studentId, slotId])` |
| **`Event`** | Campus webinars, workshops, reunions, and talks organized by Users | `title`, `description`, `category`, `location`, `eventType` (`VIRTUAL`, `IN_PERSON`, `HYBRID`), `startDate`, `endDate`, `capacity`, `organizerId` |
| **`EventRegistration`** | Event registration association connecting Attendees with Events | `eventId`, `userId`, `status` (`REGISTERED`, `ATTENDED`, `CANCELLED`), `registeredAt`, `@@unique([eventId, userId])` |

### Relationships & Named Relations

- **User ↔ Profile (1-to-1)**: `User.profile` ↔ `Profile.user` (`onDelete: Cascade`).
- **User ↔ UserSkill (1-to-Many)**: `User.userSkills` ↔ `UserSkill.user` (`onDelete: Cascade`).
- **Skill ↔ UserSkill (1-to-Many)**: `Skill.userSkills` ↔ `UserSkill.skill` (`onDelete: Cascade`).
- **User (Alumni) ↔ JobPost (1-to-Many)**: `User.jobPosts` (`@relation("UserJobPosts")`) ↔ `JobPost.postedBy` (`onDelete: Restrict`).
- **JobPost ↔ JobReferral (1-to-Many)**: `JobPost.referrals` ↔ `JobReferral.jobPost` (`onDelete: Cascade`).
- **User (Student) ↔ JobReferral (1-to-Many)**: `User.studentReferrals` (`@relation("StudentJobReferrals")`) ↔ `JobReferral.student` (`onDelete: Restrict`).
- **User (Alumni) ↔ JobReferral (1-to-Many)**: `User.alumniReferrals` (`@relation("AlumniJobReferrals")`) ↔ `JobReferral.alumni` (`onDelete: Restrict`).
- **User (Alumni) ↔ MentorshipSlot (1-to-Many)**: `User.mentorshipSlots` (`@relation("AlumniMentorshipSlots")`) ↔ `MentorshipSlot.alumni` (`onDelete: Restrict`).
- **User (Student) ↔ MentorshipRequest (1-to-Many)**: `User.mentorshipRequests` (`@relation("StudentMentorshipRequests")`) ↔ `MentorshipRequest.student` (`onDelete: Restrict`).
- **MentorshipSlot ↔ MentorshipRequest (1-to-Many)**: `MentorshipSlot.requests` ↔ `MentorshipRequest.slot` (`onDelete: Cascade`).
- **User ↔ Event (1-to-Many Organizer)**: `User.organizedEvents` (`@relation("OrganizedEvents")`) ↔ `Event.organizer` (`onDelete: Restrict`).
- **Event ↔ EventRegistration (1-to-Many)**: `Event.registrations` ↔ `EventRegistration.event` (`onDelete: Cascade`).
- **User ↔ EventRegistration (1-to-Many)**: `User.eventRegistrations` (`@relation("UserEventRegistrations")`) ↔ `EventRegistration.user` (`onDelete: Cascade`).

### Data Integrity Rules & Protections

- **Unique Email**: `User.email` is globally unique.
- **1-to-1 Profile**: `Profile.userId` is unique; cascading delete removes profile when user is removed.
- **Duplicate Prevention**:
  - `@@unique([userId, skillId])` prevents duplicate skill tags on user profiles.
  - `@@unique([studentId, jobPostId])` prevents duplicate job referral requests for the same post.
  - `@@unique([studentId, slotId])` prevents duplicate requests for the same mentorship slot.
  - `@@unique([eventId, userId])` prevents duplicate registrations for the same event.
- **Audit & Accidental Deletion Protection**: `onDelete: Restrict` is enforced on foreign keys linking users to posted jobs, referrals, mentorship slots, and organized events to prevent accidental destruction of transactional history.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20+` or `v25+`
- **npm**: `v9+` or `v11+`
- **PostgreSQL**: `v14+` or `v16+` (running on port `5432`)
- **Git**

---

### 1. Setup Backend (`server/`)

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the local environment file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *Edit `DATABASE_URL` in `.env` to match your local PostgreSQL connection string.*

4. Ensure your PostgreSQL database is created:
   ```bash
   # Using PostgreSQL CLI
   createdb alumni_connect
   ```

5. Run Prisma migrations to sync database schema:
   ```bash
   npx prisma migrate dev
   ```

6. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```

7. Seed the initial Administrator account:
   ```bash
   npm run seed
   ```

8. Start the development server:
   ```bash
   npm run dev
   ```
   The backend API will start on `http://localhost:5001`.

8. Verify server health:
   ```bash
   curl http://localhost:5001/api/health
   ```

---

### 2. Setup Frontend (`client/`)

1. In a separate terminal, navigate to the client folder:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the local environment file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 👥 Development Phase & Team Roadmap

- **Phase 1 (Completed)**: Project initialization, folder architecture, tooling, Vite React setup, and Express API server foundation.
- **Phase 2 (Completed)**: PostgreSQL database architecture design, Prisma 7 configuration, driver adapter integration, and initial migration `20261107083835_init`.
- **Phase 3 (Completed)**: Complete JWT authentication and RBAC system (`POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`), HttpOnly cookies, bcrypt password hashing, `authenticateToken` and `authorizeRoles` middlewares, and secure admin seed script.
- **Phase 4 (Completed)**: User & Profile Management (`GET /api/users/me`, `PUT /api/users/me`, `GET /api/users/:id`), Skills Management (`GET /api/skills`, `POST /api/users/me/skills`, `DELETE /api/users/me/skills/:skillId`), and Administrative Oversight (`GET /api/admin/users`, `GET /api/admin/users/:id`, `PATCH /api/admin/users/:id/status`).
- **Phase 5 (Upcoming)**: Advanced features (Intelligent Alumni Matching, Mentorship Slot Booking, Job Board & Referrals, Events).
