# AlumniConnect — Member 1 Foundation Handover

This document records the current foundation implementation based on repository inspection. It does not claim live database or full workflow verification; configure PostgreSQL and run the checks listed below for that.

## Foundation

- React client and Express server are separated into `client/` and `server/` with independent package manifests.
- Prisma schema and baseline migration define 10 models and 9 enums, including users, profiles, skills, jobs, referrals, mentorship and events.
- Authentication uses bcrypt password hashing, JWT validation and an HttpOnly cookie. Public registration allows STUDENT and ALUMNI; ADMIN is provisioned by the seed script.
- Environment examples are provided at `server/.env.example` and `client/.env.example`; real `.env` files are ignored by Git.
- User profile and skills APIs, role authorization, health endpoint, centralized error handling and graceful server shutdown are in place.

## Database and security notes

- Schema relations, foreign keys, uniqueness and indexes are declared in `server/prisma/schema.prisma`; migration SQL is under `server/prisma/migrations/`.
- Production startup requires a configured JWT secret of at least 32 characters. Development generates a process-local random secret if one is absent, so local sessions expire on restart.
- Admin seeding requires an explicit strong `ADMIN_PASSWORD`; no shared password is included.
- Public user lookup excludes email and inactive accounts. The authenticated `/api/users/me` response includes the current user's own email.

## Local setup

1. Copy `server/.env.example` to `server/.env`, set a working `DATABASE_URL`, a unique `JWT_SECRET`, and a strong `ADMIN_PASSWORD`.
2. Create the `alumni_connect` database and run `cd server && npm install && npx prisma migrate dev && npx prisma generate && npm run seed`.
3. Run `npm run dev` from `server/` and `npm run dev` from `client/` in separate terminals.
4. Verify `GET http://localhost:5001/api/health` and then exercise authentication and role workflows using test accounts.

## Verification status

`npx prisma validate` checks schema validity without connecting to PostgreSQL. Database migrations, seed execution, APIs and complete browser workflows require valid local PostgreSQL credentials. The repository does not include those credentials or a dedicated test database.

See [`API_REFERENCE.md`](API_REFERENCE.md) for the integrated endpoint inventory and the Member 2/3 handovers for module-specific details.
