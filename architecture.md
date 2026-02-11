# Architecture

This document outlines the architecture for the Tryphasing system, encompassing backend, frontend, database, key logic systems, and Twitch integration. This architecture was designed to meet the specified requirements for maintainability, extensibility, and adherence to technical constraints.

#### 1. Overall Project Structure

A monorepo approach with separate `backend` and `frontend` directories is used. Each manages its own dependencies and build processes.

```
tryphasing/
├── backend/                  # Node.js Express/Socket.IO server, Prisma ORM
├── frontend/                 # React UI for Admin and OBS Overlay
├── tasks/
│   ├── runs/                 # Detailed task run logs
│   ├── lessons.md            # Lessons learned from tasks
│   └── todo.md               # High-level TODO list
├── .gitignore
├── README.md
```

#### 2. Backend Architecture (Node.js)

*   **Technology Stack:** Node.js, Express.js, TypeScript, Socket.IO.
*   **ORM:** Prisma.
    *   **Justification:** Prisma provides a modern, type-safe, and developer-friendly ORM. Its schema definition is clear, it generates a robust client, and its migration system is well-suited for PostgreSQL. It reduces boilerplate and improves data consistency.
*   **Core Responsibilities:**
    *   Manages database interactions (via Prisma).
    *   Implements business logic (pack opening, collection management, drop rate calculation, queue management).
    *   Handles Socket.IO real-time communication.
    *   Exposes REST API endpoints for the Admin interface.
    *   Processes Twitch EventSub WebSocket events.
    *   Serves the frontend (React app and OBS overlay static files).

##### Folder Structure (`backend/`):
    ```
    backend/
    ├── src/
    │   ├── api/                  # REST API controllers for admin actions (e.g., /admin/cards, /admin/sets)
    │   │   ├── admin.controller.ts
    │   │   └── ...
    │   ├── services/             # Encapsulates core business logic. Dependant on repositories.
    │   │   ├── card.service.ts
    │   │   ├── pack-opening.service.ts
    │   │   ├── viewer.service.ts
    │   │   ├── collection.service.ts
    │   │   └── drop-rate.service.ts
    │   ├── repositories/         # Abstraction layer for database interactions (using Prisma client).
    │   │   ├── card.repository.ts
    │   │   ├── viewer.repository.ts
    │   │   └── ...
    │   ├── socket/               # Socket.IO event handlers and logic.
    │   │   ├── index.ts          # Socket.IO server setup.
    │   │   ├── pack-events.ts    # Logic for pack opening related Socket.IO events.
    │   │   └── admin-events.ts   # Socket.IO events for admin panel (optional).
    │   ├── twitch/               # Twitch EventSub WebSocket client and event handling.
    │   │   ├── eventsub.service.ts
    │   │   └── ...
    │   ├── queue/                # Pack opening queue management.
    │   │   └── pack-opening.queue.ts
    │   ├── utils/                # General utility functions (e.g., rarity weights, error handling).
    │   ├── config/               # Environment variables, constants, global configurations.
    │   ├── prisma/               # Prisma schema definition and migrations.
    │   │   └── schema.prisma
    │   ├── server.ts             # Express app setup, Socket.IO server initialization, start-up logic.
    │   └── app.ts                # Main application entry point.
    ├── tests/
    │   ├── unit/                 # Unit tests for services, queue, utilities.
    │   ├── integration/          # Integration tests for API endpoints, database interactions.
    │   └── fixtures/             # Test data.
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ```

#### 3. Frontend Architecture (React)

*   **Technology Stack:** React, TypeScript, Vite (for fast development), Tailwind CSS, Socket.IO client.
*   **State Management:** Zustand (preferred for its simplicity, performance, and scalability compared to React Context API for managing application-wide states like pack opening status, viewer collection, etc.).
*   **Core Responsibilities:**
    *   Renders the OBS overlay with real-time pack opening animations.
    *   Provides a simple Admin Interface for managing cards, sets, and drop rates.
    *   Communicates with the backend via REST APIs (Admin) and Socket.IO (real-time updates, animations).

##### Folder Structure (`frontend/`):
    ```
    frontend/
    ├── public/
    │   ├── index.html
    │   └── assets/               # Placeholder images for cards, packs etc.
    ├── src/
    │   ├── components/           # Reusable UI components (e.g., Button, Modal, CardDisplay, PackAnimation)
    │   │   ├── common/
    │   │   └── animation/
    │   ├── pages/
    │   │   ├── Overlay/          # OBS Overlay component, accessed via a dedicated route (e.g., /overlay)
    │   │   │   ├── Overlay.tsx
    │   │   │   └── overlay.store.ts # Zustand store for overlay-specific state
    │   │   │   └── overlay.css   # Specific styles for the overlay
    │   │   ├── Admin/            # Admin interface pages (e.g., /admin, /admin/sets, /admin/cards, /admin/droprates)
    │   │   │   ├── AdminLayout.tsx
    │   │   │   ├── SetManagement.tsx
    │   │   │   ├── CardManagement.tsx
    │   │   │   ├── DropRateManagement.tsx
    │   │   │   └── admin.store.ts # Zustand store for admin-specific state
    │   │   └── NotFound.tsx
    │   ├── hooks/                # Custom React hooks (e.g., useSocket)
    │   ├── stores/               # Global Zustand stores (e.g., auth, general app state)
    │   │   └── app.store.ts
    │   ├── services/             # API interaction (axios), Socket.IO client setup.
    │   │   ├── api.ts
    │   │   └── socket.ts
    │   ├── assets/               # Local images, fonts (if not served from public or backend)
    │   ├── styles/               # Tailwind CSS configuration, global styles.
    │   │   └── index.css
    │   ├── utils/                # Frontend utility functions.
    │   ├── App.tsx               # Main application component, handles routing.
    │   ├── main.tsx              # Entry point for React application.
    │   └── router.tsx            # React Router DOM configuration.
    ├── tests/
    │   └── ...                   # Component tests (e.g., React Testing Library, Jest)
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── vite.config.ts
    ```

#### 4. Database Model (PostgreSQL with Prisma Schema)

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Defines possible card rarities.
enum Rarity {
  COMMON
  UNCOMMON
  RARE
  SUPER_RARE
  EPIC
  LEGENDARY
  LEGENDARY_ALT
}

// Represents a collection of cards (e.g., a pack type).
model Set {
  id         String @id @default(uuid())
  name       String @unique
  image      String // URL to the pack image.
  totalCards Int    @default(0) // Will be updated by application logic.
  cards      Card[] // Relation to Card model.

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Represents an individual trading card.
model Card {
  id          String @id @default(uuid())
  name        String @unique
  description String?
  image       String // URL to the card artwork.
  rarity      Rarity

  setId String // Foreign key to the Set model.
  set   Set    @relation(fields: [setId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // For distinct card counting in stats.
  collections Collection[]
}

// Represents a Twitch viewer.
model Viewer {
  id         String @id @default(uuid())
  twitchId   String @unique // Unique identifier from Twitch.
  username   String
  collection Collection[] // Relation to Collection model.

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Represents a viewer's ownership of a specific card.
model Collection {
  id        String @id @default(uuid())
  viewerId  String
  viewer    Viewer @relation(fields: [viewerId], references: [id])
  cardId    String
  card      Card   @relation(fields: [cardId], references: [id])
  quantity  Int    @default(1) // Number of copies of this specific card the viewer owns.

  // Ensures a viewer can only have one entry per card in their collection.
  @@unique([viewerId, cardId])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Stores configurable drop rates for each rarity.
model DropRate {
  id     String  @id @default(uuid())
  rarity Rarity  @unique
  rate   Float   // Probability (e.g., 0.05 for 5%). Sum of all rates should ideally be 1.0.

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Database Model Notes:**
*   `Set.totalCards` is maintained by the backend application logic (e.g., a `CardService` method to add/remove cards from a set).
*   `DropRate.rate` stores values between 0 and 1, representing probabilities. The sum of all `DropRate.rate` entries should be validated to be 1 (or normalized during runtime) to ensure 100% drop chance across rarities.

#### 5. Configurable Drop Rate System

*   **Storage:** Drop rates are stored in the `DropRate` database table. Each `Rarity` enum value has a corresponding `rate`.
*   **Admin Interface:** The frontend Admin panel provides a dedicated page (`/admin/droprates`) to view and modify these `rate` values for each rarity. The backend `DropRateService` handles persistence.
*   **Backend Logic (`DropRateService` & `PackOpeningService`):**
    1.  When a pack opening is initiated, the `PackOpeningService` queries the `DropRateService` to fetch all current rarity rates.
    2.  The `DropRateService` can optionally normalize these rates if their sum deviates from 1.
    3.  A random floating-point number between 0 and 1 is generated.
    4.  The service then iterates through the sorted rarities (e.g., `COMMON` to `LEGENDARY_ALT`), accumulating their rates. The first rarity whose cumulative rate exceeds the random number is selected.
    5.  Once the rarity is determined, the `PackOpeningService` selects a random card *of that specific rarity* from the chosen `Set`.

#### 6. Queue Design for Simultaneous Pack Openings

*   **Purpose:** Ensures sequential processing and animation of pack openings when multiple viewers trigger them.
*   **Implementation:** An in-memory queue (`pack-opening.queue.ts`) on the backend.
*   **Queue Item:** Each item in the queue is an object containing:
    *   `viewerTwitchId`: Twitch ID of the viewer.
    *   `viewerUsername`: Username for display.
    *   `setId`: ID of the set being opened.
    *   `packOpeningRequestId`: A unique ID for the specific pack opening instance.
*   **Processing Logic (`PackOpeningQueueService`):**
    1.  **Enqueue:** When a pack opening is triggered (via Twitch EventSub), a request is pushed into the queue.
    2.  **Processing Loop:** A background process (e.g., a `setInterval` or recursive function) monitors the queue.
    3.  **`isProcessing` Flag:** A boolean flag (`isProcessing: boolean`) prevents multiple concurrent openings.
    4.  If `isProcessing` is `false` and the queue is not empty:
        *   Sets `isProcessing = true`.
        *   Dequeues the next request.
        *   Executes the `PackOpeningService` logic (random card selection, collection update).
        *   Emits Socket.IO event (`packOpeningStarted`) to the OBS overlay with the selected card's details and viewer information.
        *   Waits for animation completion acknowledgment from the frontend via Socket.IO (`animationComplete` event).
        *   Once acknowledged, sets `isProcessing = false`.
        *   Immediately checks the queue again for the next item.
    5.  **Robustness (Local):** For local-only use, an in-memory queue is acceptable. Server restarts will clear the queue, which is an understood limitation for a local development tool.

#### 7. Twitch Integration Strategy: EventSub WebSocket

*   **Choice:** Twitch EventSub WebSocket.
*   **Justification:**
    *   **Local Development Friendly:** Does not require public-facing endpoints or tunneling services (like `ngrok`), as Twitch connects directly to the local WebSocket server. This greatly simplifies development setup.
    *   **Modern API:** EventSub is the recommended and most robust method for receiving Twitch events.
    *   **Direct & Real-time:** Provides low-latency, real-time event delivery crucial for live stream interactions.
    *   **Channel Points Support:** Directly supports `channel.channel_points_custom_reward_redemption.add` events.

*   **Backend Implementation (`twitch/eventsub.service.ts`):**
    1.  The backend establishes a WebSocket connection to Twitch's EventSub endpoint.
    2.  It subscribes to the `channel.channel_points_custom_reward_redemption.add` event for the streamer's Twitch channel.
    3.  Upon receiving a redemption event, it:
        *   Validates the reward ID against a configured "Pack Opening Reward ID" (stored in `.env` or database).
        *   Extracts the `twitchId` and `username` of the redeeming viewer.
        *   Calls the `PackOpeningQueueService.enqueue()` method to add the request to the processing queue.
    4.  Requires handling of connection lifecycle (reconnections, subscription renewal).
    5.  **Authentication:** The backend obtains an App Access Token from Twitch for the EventSub subscription.

#### 8. Animation Flow (Frontend - OBS Overlay)

The frontend Overlay component (`frontend/src/pages/Overlay/Overlay.tsx`) is a dedicated React application accessible via a specific local URL (e.g., `http://localhost:3000/overlay`). It listens for Socket.IO events from the backend to trigger and control the animation.

*   **Step 1: Pack Visible → Opening Animation**
    *   Backend emits `packOpeningStarted` with `packImageURL` and `cardDetails`.
    *   Overlay receives `packOpeningStarted`, displays the `packImageURL`.
    *   Plays an animation (CSS transitions/animations or a library like `Framer Motion`) to visually open the pack.
*   **Step 2: Card Emerges → Fullscreen Display → Zoom Artwork + Name**
    *   After pack opening animation, the `cardDetails.image` is displayed, emerging from the pack.
    *   The card zooms to fullscreen.
    *   A focus effect (e.g., zoom) on the card's artwork is applied.
    *   The `cardDetails.name` is prominently displayed (e.g., above the card).
*   **Step 3: Dezoom → Display Statistics**
    *   After a configurable delay (or user interaction in a more complex setup), the card dezooms.
    *   Statistics are displayed:
        *   "Cartes DISTINCTES du set: X/Y" (X = distinct cards viewer owns from this set, Y = total distinct cards in the set).
        *   "Cartes DISTINCTES totales collection: Z" (Z = total distinct cards viewer owns across all sets).
    *   Backend calculates and provides these statistics with the `packOpeningStarted` event, or a subsequent `packOpeningStats` event.
    *   Once statistics are displayed for a duration, the overlay clears the animation and emits `animationComplete` Socket.IO event to the backend.

#### 9. Admin Interface

*   **Location:** Part of the main React frontend application, accessible via routes like `/admin`.
*   **Functionality:**
    *   **Set Management (`/admin/sets`):** Lists, Creates, Edits (name, pack image), Deletes Sets.
    *   **Card Management (`/admin/cards`):** Lists, Creates, Edits (name, description, artwork image, rarity, associates to Set), Deletes Cards.
    *   **Image Upload:** Integrated into Card/Set creation/editing forms (backend handles file storage, e.g., local filesystem for local-only, or cloud storage if ever externalized). For local, stores images in `frontend/public/assets/cards` and `frontend/public/assets/packs` for simplicity initially.
    *   **Drop Rate Management (`/admin/droprates`):** Views and adjusts probabilities for each `Rarity`.

#### 10. Initial Placeholder Data

*   **Backend Seeder:** A script (e.g., `backend/prisma/seed.ts`) populates the database with:
    *   **1 Set:** `Set` entry with a placeholder pack image.
    *   **10 Cards:** `Card` entries associated with the set, covering all `Rarity` values, with placeholder names, descriptions, and image URLs.
    *   **Drop Rates:** Default `DropRate` entries for all `Rarity` values (e.g., Common: 0.5, Uncommon: 0.25, Rare: 0.15, Super Rare: 0.07, Epic: 0.02, Legendary: 0.007, Legendary Alt: 0.003 - sum to 1.0).
*   **Frontend Assets:** Placeholder images for cards and packs are stored in `frontend/public/assets/`.

#### 11. Testing

*   **Unit Tests:**
    *   `PackOpeningService`: Drop rate logic, card selection.
    *   `CollectionService`: Distinct counting logic, quantity updates.
    *   `PackOpeningQueueService`: Queue behavior, sequential processing.
    *   `TwitchEventSubService`: Event parsing and triggering.
*   **Integration Tests:**
    *   Backend API endpoints (Admin CRUD operations).
    *   Database interactions (Prisma repositories).
    *   Socket.IO event handling (backend to frontend).
*   **E2E Tests:** To be considered when infrastructure is more stable (later phase).