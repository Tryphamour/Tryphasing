### Implementation Phase - Part 1: Project Setup & Backend Core (2026-02-11)

This run file details the first part of the implementation phase, focusing on setting up the project workspace, initializing the backend, defining the database schema, and implementing foundational backend services and API endpoints.

**Goals for this Run:**
*   Initialize project with `backend/` and `frontend/` directories.
*   Setup `backend/` Node.js environment with TypeScript, Express, Socket.IO, and Prisma.
*   Define the complete Prisma schema (`schema.prisma`) including all models (Set, Card, Viewer, Collection, DropRate, Rarity enum).
*   Configure Prisma for a local PostgreSQL database and setup initial migration.
*   Implement basic data access (repositories) and business logic (services) for Set, Card, and DropRate management.
*   Expose REST API endpoints for Admin functionalities (CRUD for Sets, Cards, DropRates).
*   Initialize the Express server and a basic Socket.IO server.
*   Create a Prisma seeding script for initial placeholder data.
*   Implement foundational unit tests for backend services.

**Detailed Steps:**

**1. Workspace & Backend Project Setup:**
    *   Create `backend/` and `frontend/` directories at the project root.
    *   Inside `backend/`: `npm init -y`, install `typescript`, `ts-node`, `nodemon`.
    *   Configure `tsconfig.json` for Node.js.
    *   Install `express`, `@types/express`, `socket.io`, `@types/socket.io`.
    *   Install `prisma`, `@prisma/client`.

**2. Prisma & Database Setup:**
    *   `npx prisma init` to create `prisma/` directory and `schema.prisma`.
    *   Update `schema.prisma` with the defined models (Set, Card, Viewer, Collection, DropRate, Rarity enum) from the architectural proposal.
    *   Configure `DATABASE_URL` in `backend/.env`.
    *   Create initial migration: `npx prisma migrate dev --name init`.

**3. Backend Core Structure & Repositories:**
    *   Create `backend/src/` directory with `api/`, `services/`, `repositories/`, `socket/`, `twitch/`, `queue/`, `utils/`, `config/`, `prisma/`.
    *   Implement `backend/src/repositories/base.repository.ts` (generic Prisma client wrapper).
    *   Implement `backend/src/repositories/card.repository.ts`, `set.repository.ts`, `drop-rate.repository.ts`, `viewer.repository.ts`, `collection.repository.ts` using Prisma client.

**4. Backend Services (CRUD for Admin):**
    *   Implement `backend/src/services/card.service.ts` (create, find, update, delete Card).
    *   Implement `backend/src/services/set.service.ts` (create, find, update, delete Set).
    *   Implement `backend/src/services/drop-rate.service.ts` (find all, update DropRate).

**5. Backend API & Server Setup:**
    *   Implement `backend/src/api/admin.controller.ts` (REST endpoints using services).
    *   Implement `backend/src/server.ts` to setup Express app, attach `admin.controller` routes, and initialize Socket.IO server.
    *   Create `backend/src/app.ts` as the main entry point to start the server.

**6. Seeding Script:**
    *   Create `backend/prisma/seed.ts` to populate the DB with placeholder data (1 Set, 10 Cards, default DropRates).

**7. Initial Unit Tests:**
    *   Setup `jest` or similar testing framework for backend.
    *   Write basic unit tests for `CardService.ts` (e.g., create, find card).
    *   Write basic unit tests for `SetService.ts` (e.g., create, find set).

**Verification Steps for this Run:**
*   `npm install` completes successfully in `backend/`.
*   `npx prisma migrate dev` runs without errors, and the database schema is created correctly.
*   The backend server starts without errors (`npm start` or similar).
*   Admin API endpoints (e.g., `/admin/sets`, `/admin/cards`, `/admin/droprates`) can be accessed (e.g., with `curl` or Postman) and return expected data (empty initially, then seeded data).
*   Socket.IO server initializes successfully (check logs).
*   The seeding script (`npx prisma db seed`) runs successfully and populates the database with initial data.
*   All implemented backend unit tests pass.

**Risks:**
*   Prisma configuration or migration issues.
*   Type conflicts between Prisma and application logic.
*   Socket.IO initialization errors.
*   Basic CRUD operations not functioning as expected.
*   Image upload strategy for admin interface (initial implementation will use URL strings).

**Completion Summary:**
All outlined steps for the "Project Setup & Backend Core" phase have been successfully completed.

1.  **Workspace & Backend Project Setup:** Directories created, `package.json` initialized, `tsconfig.json` configured, and all necessary dependencies installed.
2.  **Prisma & Database Setup:** `schema.prisma` defined, `.env` configured, and initial migration applied successfully after resolving `prisma.config.ts` and authentication issues. PostgreSQL database is now correctly set up.
3.  **Backend Core Structure & Repositories:** `src/` directories created, and all `*Repository.ts` files implemented (Card, Set, Viewer, Collection, DropRate, Prisma client singleton).
4.  **Backend Services (CRUD for Admin):** `CardService.ts`, `SetService.ts`, and `DropRateService.ts` implemented with basic CRUD operations and necessary validation.
5.  **Backend API & Server Setup:** `admin.controller.ts` implemented with REST endpoints for Sets, Cards, and DropRates. `server.ts` and `app.ts` configured for Express app, middleware, Socket.IO initialization, and server startup.
6.  **Seeding Script:** `prisma/seed.ts` created for populating initial placeholder data (Set, Cards, DropRates).
7.  **Initial Unit Tests:** Jest installed and configured. Unit tests for `CardService` and `SetService` implemented and successfully passed after resolving TypeScript typing issues with Jest mocks.

This phase provides a solid foundation for the backend, with a functional database schema, core CRUD services, admin API, and a basic server setup.