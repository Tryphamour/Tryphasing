# Active
- Frontend Core & Admin Interface:
    - Setup `frontend/`: React, TypeScript, Vite, Tailwind CSS, Socket.IO client, Zustand, React Router DOM. (completed)
    - Configure Tailwind CSS. (completed)
    - Setup `frontend/src/router.tsx` with routes for `/admin` and `/overlay`. (completed)
    - Implement `frontend/src/services/socket.ts` (Socket.IO client setup). (completed)
    - Implement `frontend/src/pages/Admin/AdminLayout.tsx` (basic admin layout). (completed)
    - Implement `frontend/src/pages/Admin/SetManagement.tsx` (List/Create Sets via backend API). (completed)
    - Implement `frontend/src/pages/Admin/CardManagement.tsx` (List/Create Cards, associate with Sets, basic image handling). (completed)
    - Implement `frontend/src/pages/Admin/DropRateManagement.tsx` (List/Update DropRates). (in_progress)

# Backlog
- Core Business Logic & Twitch Integration
- OBS Overlay

# Done
- Implement Backend Core:
    - Initialize project workspace with `backend/` and `frontend/` directories.
    - Setup `backend/`: Node.js, TypeScript, Express, Socket.IO, Prisma, PostgreSQL.
    - Define `prisma/schema.prisma` (Set, Card, Viewer, Collection, DropRate, Rarity enum).
    - Setup Prisma migrations and connect to a local PostgreSQL DB.
    - Implement `backend/src/repositories/` (Prisma client wrappers).
    - Implement `backend/src/services/card.service.ts` (CRUD for Cards).
    - Implement `backend/src/services/set.service.ts` (CRUD for Sets).
    - Implement `backend/src/services/drop-rate.service.ts` (CRUD for DropRates).
    - Implement `backend/src/api/admin.controller.ts` (REST endpoints for Sets, Cards, DropRates).
    - Setup `backend/src/server.ts` (Express server, basic routes, Socket.IO initialization).
    - Create initial data seeder (`backend/prisma/seed.ts`).
    - Implement basic backend unit tests for `CardService` and `SetService`.