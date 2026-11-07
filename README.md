# AlumniConnect

Intelligent Platform to Interconnect Alumni and Students.

AlumniConnect is a web platform designed to foster meaningful engagement between students, alumni, and college administrators. The platform will support professional networking, intelligent alumni-student mentorship matching, job and referral postings, and institutional event coordination.

---

## 🛠 Tech Stack

- **Frontend**: React.js with Vite, HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL (planned)
- **ORM**: Prisma ORM (planned)
- **Authentication**: JWT-based Authentication (planned)
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
├── server/                     # Backend API application (Node.js + Express)
│   ├── prisma/                 # Prisma ORM schema and database migrations
│   │   └── schema.prisma       # Database schema definition
│   ├── src/
│   │   ├── config/             # Environment and application configuration
│   │   ├── middleware/         # Custom Express middlewares (error handling, auth)
│   │   ├── modules/            # Feature modules (auth, alumni, students, jobs, etc.)
│   │   ├── utils/              # Helper and utility functions
│   │   └── server.js           # Express app initialization and server entry point
│   ├── .env.example            # Backend environment variable template
│   └── package.json            # Backend dependencies and scripts
├── .gitignore                  # Git ignore rules for node_modules, build, and env files
└── README.md                   # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18+` (Recommended: `v20+` or `v25+`)
- **npm**: `v9+` or `v11+`
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

4. Start the development server:
   ```bash
   npm run dev
   ```
   The backend API will start on `http://localhost:5001` (or the port defined in `.env`).

5. Verify server health:
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

This project is built collaboratively in stages across three team members:

- **Phase 1 (Completed)**: Project initialization, folder architecture, tooling, Vite React setup, and Express API server foundation.
- **Phase 2 (Upcoming)**: Database design with PostgreSQL & Prisma ORM, and JWT authentication.
- **Phase 3 (Upcoming)**: Core feature modules (Profiles, Intelligent Alumni Matching, Mentorship, Job Board, Events).
