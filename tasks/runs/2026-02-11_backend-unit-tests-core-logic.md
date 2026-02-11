### Implementation Phase - Part 3.1: Backend Unit Tests (Core Logic) (2026-02-11)

This run file details the implementation of unit tests for the core backend services and logic introduced in Phase 3.

**Goals for this Run:**
*   Implement unit tests for `ViewerService`.
*   Implement unit tests for `CollectionService`.
*   Implement unit tests for `PackOpeningService`.
*   Implement unit tests for `PackOpeningQueue`.
*   Implement unit tests for `TwitchEventSubService`.

**Detailed Steps:**

**1. `viewer.service.test.ts`:**
    *   Mock `ViewerRepository`.
    *   Test `findOrCreateViewer`:
        *   Scenario: Viewer does not exist, should create and return new viewer.
        *   Scenario: Viewer exists, should find and return existing viewer.
        *   Scenario: Viewer exists but username changed, should update username and return updated viewer.
    *   Test `findByTwitchId`: Find existing viewer, return null if not found.
    *   Test `findViewerById`: Find existing viewer, return null if not found.
    *   Test `findAllViewers`: Return list of viewers.

**2. `collection.service.test.ts`:**
    *   Mock `CollectionRepository`, `CardRepository`, `SetRepository`.
    *   Test `addCardToCollection`:
        *   Scenario: Card does not exist, throw error.
        *   Scenario: Card exists, call `collectionRepository.upsert` with correct parameters.
    *   Test `getDistinctCardsInSet`:
        *   Scenario: Returns correct count of distinct cards in a given set for a viewer.
        *   (Note: Acknowledge current inefficiency of `cardRepository.findAll` and filter).
    *   Test `getTotalDistinctCards`:
        *   Scenario: Returns correct total count of distinct cards for a viewer.

**3. `pack-opening.service.test.ts`:**
    *   Mock `ViewerService`, `CollectionService`, `DropRateService`, `CardRepository`, `SetRepository`.
    *   Test `openPack`:
        *   Scenario: Valid viewer and set, returns `PackOpeningResult` with correct card and stats.
        *   Scenario: Invalid viewer or set, throws error.
        *   Scenario: Drop rate logic correctly determines rarity (mock `Math.random`).
        *   Scenario: No cards found for determined rarity, throws error.
        *   Scenario: `collectionService.addCardToCollection` is called.
        *   Scenario: `collectionService.getDistinctCardsInSet` and `getTotalDistinctCards` are called.
    *   Test `determineDroppedRarity`:
        *   Scenario: Correctly determines rarity based on given drop rates.
        *   Scenario: Handles empty or invalid drop rates.
        *   Scenario: Normalizes rates if sum is not 1.

**4. `pack-opening.queue.test.ts`:**
    *   Mock `SocketIOServer`, `PackOpeningService`.
    *   Test `enqueue`: Adds request to queue.
    *   Test `processQueue`:
        *   Scenario: Processes requests sequentially.
        *   Scenario: Emits `packOpeningStarted` and `packOpeningComplete` events.
        *   Scenario: Handles `packOpeningService` errors, emits `packOpeningError`.
        *   Scenario: Correctly waits for animation completion (`resolveAnimationComplete`).

**5. `eventsub.service.test.ts`:**
    *   Mock `WebSocket`, `PackOpeningQueue`, `ViewerService`.
    *   Mock `fetch` for Twitch API calls (token, subscriptions).
    *   Test `start`: Connects WebSocket, fetches token.
    *   Test `handleWebSocketMessage`:
        *   Scenario: `session_welcome`, sets `sessionId`, subscribes.
        *   Scenario: `notification` (channel points), calls `viewerService.findOrCreateViewer` and `packOpeningQueue.enqueue`.
        *   Scenario: Filters out non-pack opening rewards.
        *   Scenario: `session_reconnect`, closes connection.
    *   Test `getAppAccessToken`: Fetches and stores token.
    *   Test `subscribeToChannelPoints`: Makes correct API call.

**Verification Steps for this Run:**
*   All unit tests for each service/component pass without errors.
*   Test coverage is adequate for critical business logic.

**Risks:**
*   Complexity of mocking external dependencies like `WebSocket` and `fetch`.
*   Ensuring comprehensive test coverage for all edge cases in probabilistic logic and queue management.
*   Accurate mocking of `uuid` for consistent `requestId`s in queue tests.
