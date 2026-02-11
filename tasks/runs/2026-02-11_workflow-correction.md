### Workflow Correction - Update Architecture and Lessons Learned (2026-02-11)

This run file details the correction of an oversight in the project workflow, specifically addressing the empty `architecture.md` file and the almost empty `lessons.md` file.

**Goals for this Run:**
*   Populate `architecture.md` with the validated architectural proposal.
*   Update `lessons.md` with additional significant lessons learned throughout the implementation phases.

**Detailed Steps:**

**1. Update `architecture.md`:**
    *   Read the content of `tasks/runs/2026-02-11_architecture-proposal.md`.
    *   Write this content directly into `architecture.md`.

**2. Update `lessons.md`:**
    *   Review all previously completed `tasks/runs/*.md` files for key challenges, decisions, and workarounds.
    *   Add new entries to `lessons.md` for:
        *   Prisma `url` property deprecation and handling (v7.3.0 update).
        *   PostgreSQL setup issues (Docker vs. manual, authentication).
        *   TypeScript/Jest mocking challenges and solutions (`jest.fn` types, `as unknown as`, `jest.Mocked`).
        *   Inefficiency noted in `SetService.deleteSet` and `PackOpeningService.openPack` (using `findAll` then filtering), and the subsequent fix in `CollectionService` by extending `CollectionRepository`.
        *   Duplication of `Rarity` enum and other interfaces in frontend `api.ts` vs. shared types.

**Verification Steps for this Run:**
*   `architecture.md` is no longer empty and contains the complete architectural proposal.
*   `lessons.md` contains additional relevant entries documenting technical challenges and their resolutions.
*   All existing code remains functional and passes tests.

**Risks:**
*   Accidentally overwriting or corrupting existing files.
*   Missing a significant lesson learned.
*   Not accurately reflecting the original architectural proposal.
