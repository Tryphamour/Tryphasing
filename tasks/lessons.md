# Lessons Learned

## 2026-02-11 - Tailwind CSS Installation Issue on Windows (Vite React project)
**Problem:** `tailwindcss` executable (`npx tailwindcss` or direct execution via `.\node_modules\.bin\tailwindcss` or `npm run <script>`) was not recognized or found, even after successful `npm install` in a Vite React project on Windows (PowerShell). This led to failures when trying to run `tailwindcss init -p`.

**Diagnosis:**
*   `tailwindcss` package appeared in `package.json` and `node_modules/tailwindcss` existed.
*   The executable `tailwindcss` was missing from `node_modules/.bin/`. This indicates that the post-install script for `tailwindcss` which creates the symlink/executable in `.bin` might have failed or not run correctly in the specific environment.

**Solution/Workaround:**
1.  **Bypassed automated `tailwindcss init -p`:** Instead of relying on the command, manually created the necessary configuration files.
    *   Created `frontend/tailwind.config.js` with basic content.
    *   Created `frontend/postcss.config.js` with basic content.
    *   Modified `frontend/src/index.css` to import Tailwind directives (`@tailwind base; @tailwind components; @tailwind utilities;`).
2.  Removed the `tw-init` script from `frontend/package.json` as it was no longer needed.

**Prevention/Future Consideration:**
*   Investigate deeper into the specific `npm`/environment configuration on Windows that caused the executable link to fail.
*   For similar issues, manual file creation is a reliable workaround to keep development moving.
*   Always confirm executable presence in `.bin` for `npx` or `npm run` issues.

## 2026-02-11 - Prisma `url` Property Deprecation (v7.3.0)
**Problem:** Prisma version 7.3.0 deprecated the `url = env("DATABASE_URL")` property directly within the `datasource db` block of `prisma/schema.prisma`. Running `npx prisma migrate dev` resulted in an error `P1012`.
**Diagnosis:** This is a breaking change in Prisma, requiring the database connection URL for migration tools to be provided differently (e.g., directly from the `.env` file or `prisma.config.ts` for Client construction).
**Solution:** Removed the `url` property from `prisma/schema.prisma`. `npx prisma migrate dev` then correctly picked up `DATABASE_URL` from the `backend/.env` file.
**Prevention/Future Consideration:** Always check Prisma changelogs for breaking changes when updating versions.

## 2026-02-11 - PostgreSQL Setup and Authentication on Windows
**Problem:** Initial `npx prisma migrate dev` failed with `P1001: Can't reach database server` and subsequently `P1000: Authentication failed`.
**Diagnosis:**
1.  **Server Reachability:** PostgreSQL server was not running on `localhost:5432`.
2.  **Authentication:** The `DATABASE_URL` initially specified `user:password`, but the default superuser for PostgreSQL is `postgres`. The `user` was not created.
**Solution:**
1.  Guided the user through manual PostgreSQL installation on Windows (or Docker setup as an alternative).
2.  Instructed the user to create the `tryphasing_db` database using `psql`.
3.  Updated `backend/.env` `DATABASE_URL` to use `postgresql://postgres:password@localhost:5432/tryphasing_db?schema=public` to match the default superuser.
**Prevention/Future Consideration:** Provide clearer initial setup instructions for PostgreSQL credentials, emphasizing the default `postgres` user for local development.

## 2026-02-11 - TypeScript/Jest Mocking Challenges
**Problem:** Frequent `TS2339: Property 'mockResolvedValue' does not exist on type ...`, `TS2305: Module ... has no exported member`, `TS2561: Object literal may only specify known properties`, `TS7016: Could not find a declaration file for module 'ws'`, `TS18046: 'data' is of type 'unknown'`.
**Diagnosis:** These errors stemmed from incorrect TypeScript typing of mocked functions, missing `@types` packages, direct usage of Prisma client in services, and incorrect assumptions about `Prisma.CardCreateInput`/`UpdateInput` structure.
**Solution:**
*   **Exported interfaces:** Ensured `PackOpeningResult` was exported from its service.
*   **Installed missing `@types`:** Installed `@types/uuid` and `@types/ws`.
*   **Refined Service Input:** Changed `CardService` input types from direct `Prisma.CardCreateInput` to custom interfaces, then transformed data to Prisma's nested `connect` structure.
*   **Corrected Jest Mock Typing:** Used explicit `jest.fn<Promise<ReturnType>, [Args]>()` for mock methods and passed mock objects directly without `as unknown as Type` for mock object itself, or used `as unknown as Type` for mock objects but ensured explicit `jest.fn` on all methods for `mockResolvedValue` etc. The cast to `any` for `MockWebSocket` helped simplify mocking external libraries.
*   **Prisma Client Encapsulation:** Refactored `CollectionService` to use new methods (`findManyDistinctByViewerId`, `findManyDistinctByViewerIdAndCardIds`) in `CollectionRepository`, eliminating direct `prisma.collection.findMany` calls from the service.
*   **API Response Typing:** Added explicit `interface` and type assertions for `data` objects returned from `fetch` calls in `TwitchEventSubService` to resolve `unknown` type errors.
*   **Ensured `uuid` runtime dependency:** Installed `uuid` as a runtime dependency (not just `@types/uuid`).
*   **Corrected `wsInstance` capturing:** Ensured `wsInstance` in `EventSubService` tests correctly captured the specific mock `WebSocket` instance created by the service under test after `service.start()`.
**Prevention/Future Consideration:** Be very explicit with Jest mock types from the outset. Consider a shared types package for backend/frontend communication to reduce duplication and type-related errors. Regularly review test setup for correct dependency injection and mocking patterns.

## 2026-02-11 - Service Inefficiencies (Future Refactoring)
**Problem:** `SetService.deleteSet` and `PackOpeningService.openPack` initially fetched all cards (`cardRepository.findAll()`) and then filtered them in memory.
**Diagnosis:** While functionally correct for small datasets, this is inefficient for large numbers of cards, as it fetches unnecessary data from the database.
**Solution (Partial):** The pattern was identified. For `CollectionService`, a more efficient solution was implemented by adding new methods to `CollectionRepository` to push distinct counting logic to the database.
**Future Refactoring:** Implement `findBySetId(setId: string)` and `findBySetIdAndRarity(setId: string, rarity: Rarity)` methods in `CardRepository` and refactor `SetService.deleteSet` and `PackOpeningService.openPack` to use these more efficient repository methods.

## 2026-02-11 - Frontend Type Duplication vs. Shared Types
**Problem:** The `Rarity` enum and other interfaces (like `Card`, `Set`, `DropRate`) were duplicated in `frontend/src/services/api.ts` from their backend Prisma definitions.
**Diagnosis:** This leads to potential inconsistencies if backend types change, requiring manual synchronization.
**Future Consideration:** For larger projects or more complex data structures, a shared types package (e.g., generated by `prisma-json-schema-generator` or manually maintained in a common `shared/types` directory) should be implemented. This would ensure type consistency across backend and frontend, reducing errors and maintenance overhead. For this project's scope, manual duplication was a pragmatic choice for speed.
