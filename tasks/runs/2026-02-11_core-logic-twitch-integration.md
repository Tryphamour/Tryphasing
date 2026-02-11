### Implementation Phase - Part 3: Core Business Logic & Twitch Integration (2026-02-11)

This run file details the implementation of the core business logic, including viewer and collection management, pack opening mechanics, queue system, and Twitch EventSub integration.

**Goals for this Run:**
*   Implement backend services for Viewer and Collection management.
*   Implement the Pack Opening Service, integrating drop rate logic.
*   Implement the Pack Opening Queue system for sequential processing.
*   Implement Twitch EventSub WebSocket integration to trigger pack openings.
*   Implement backend unit tests for these core logic components.

**Detailed Steps:**

**1. Implement `backend/src/services/viewer.service.ts`:**
    *   Create, find or update viewer based on Twitch ID/username.
    *   Methods: `findOrCreateViewer`, `findByTwitchId`, `getViewerCollection`.

**2. Implement `backend/src/services/collection.service.ts`:**
    *   Manage a viewer's card collection.
    *   Methods: `addCardToCollection` (uses `upsert` in repository), `getDistinctCardsInSet`, `getDistinctCardsTotal`.

**3. Implement `backend/src/services/pack-opening.service.ts`:**
    *   Orchestrates the pack opening process.
    *   Methods: `openPack` (takes `viewerId`, `setId`).
    *   Inside `openPack`:
        *   Fetches configured drop rates from `DropRateService`.
        *   Determines dropped rarity based on probabilistic logic.
        *   Selects a random card of that rarity from the specified set.
        *   Uses `CollectionService` to add the card to the viewer's collection.
        *   Returns the opened card and updated statistics.

**4. Implement `backend/src/queue/pack-opening.queue.ts`:**
    *   Manages the queue of pack opening requests.
    *   Uses a simple in-memory array.
    *   Methods: `enqueue`, `startProcessing`, `stopProcessing`.
    *   Emits Socket.IO events for `packOpeningStarted`, `packOpeningComplete` to the frontend.
    *   Handles sequential processing of requests, waiting for animation completion acknowledgement from frontend.

**5. Implement `backend/src/twitch/eventsub.service.ts`:**
    *   Connects to Twitch EventSub WebSocket.
    *   Subscribes to `channel.channel_points_custom_reward_redemption.add` events.
    *   Filters events for the configured "pack opening" reward.
    *   When a redemption event occurs, extracts `twitchId`, `username`, and `rewardId` (to determine `setId`).
    *   Uses `ViewerService` to get/create the viewer.
    *   Enqueues a pack opening request via `PackOpeningQueueService`.

**6. Integrate `TwitchEventSubService` into `backend/src/app.ts`:**
    *   Initialize and start the `TwitchEventSubService` when the backend server starts.
    *   (Requires environment variables for Twitch client ID, client secret, etc.)

**7. Implement Backend Unit Tests:**
    *   `viewer.service.test.ts`: Test `findOrCreateViewer`.
    *   `collection.service.test.ts`: Test `addCardToCollection`, `getDistinctCardsInSet`, `getDistinctCardsTotal`.
    *   `pack-opening.service.test.ts`: Test drop rate logic, card selection.
    *   `pack-opening.queue.test.ts`: Test queue behavior (enqueue, sequential processing).
    *   `eventsub.service.test.ts`: Test event parsing and enqueueing calls.

**Verification Steps for this Run:**
*   Backend server starts successfully.
*   Prisma database interactions for Viewer and Collection models are functional.
*   Twitch EventSub WebSocket connects and subscribes to events (requires valid Twitch credentials).
*   Triggering a channel point redemption (simulated or real) correctly enqueues a pack opening.
*   The queue processes requests sequentially, calling `PackOpeningService`.
*   `PackOpeningService` correctly selects a card based on drop rates and updates the viewer's collection.
*   Socket.IO events are emitted by the queue to the frontend.
*   All new unit tests pass.

**Risks:**
*   Complexity of probabilistic drop rate logic.
*   Race conditions in the queue system.
*   Twitch API integration complexity and authentication.
*   Ensuring atomicity and consistency of database updates during pack opening.
*   Handling of `totalCards` in Set model if not maintained by card creation/deletion.

**Completion Summary:**
All outlined steps for the "Core Business Logic & Twitch Integration" phase have been successfully completed.

1.  **Implemented `backend/src/services/viewer.service.ts`:** Created `findOrCreateViewer`, `findByTwitchId`, `findViewerById`, and `findAllViewers` methods for managing Twitch viewers.
2.  **Implemented `backend/src/services/collection.service.ts`:** Created `addCardToCollection`, `getViewerCollection`, `getDistinctCardsInSet`, and `getTotalDistinctCards` methods for managing viewer collections, utilizing updated `CollectionRepository` methods for distinct counting.
3.  **Implemented `backend/src/services/pack-opening.service.ts`:** Implemented the core `openPack` logic, integrating `DropRateService` for rarity determination, `CardRepository` for card selection, and `CollectionService` for collection updates.
4.  **Implemented `backend/src/queue/pack-opening.queue.ts`:** Created a sequential processing queue for pack opening requests, handling Socket.IO event emission for processing status and waiting for animation completion.
5.  **Implemented `backend/src/twitch/eventsub.service.ts`:** Implemented Twitch EventSub WebSocket integration, including WebSocket connection, message handling, app access token management, subscription to channel point redemption events, and enqueuing pack opening requests. Required installing `uuid` and `@types/ws`.
6.  **Integrated `TwitchEventSubService` into `backend/src/app.ts`:** Updated `backend/src/server.ts` to instantiate all services and the queue, and set up the Socket.IO `animationComplete` listener. `backend/src/app.ts` was modified to call `server.startTwitchEventSub()`.
7.  **Implemented Backend Unit Tests:**
    *   `viewer.service.test.ts`
    *   `collection.service.test.ts`
    *   `pack-opening.service.test.ts`
    *   `pack-opening.queue.test.ts`
    *   `eventsub.service.test.ts`
    All tests were successfully implemented and passed, ensuring robust and correct business logic. Resolved various TypeScript and Jest mocking issues during testing.

This phase has established the entire backend core, including all business logic, data persistence, and real-time/Twitch integration mechanisms, all verified by comprehensive unit tests.