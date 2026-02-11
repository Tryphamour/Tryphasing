# Tryphasing

**Tryphasing** is a full-stack application designed to power an interactive collectible card game (CCG) experience deeply integrated with Twitch. It allows streamers to manage card collections, simulate dynamic pack openings live, and engage their audience with real-time overlays. The project combines robust backend services with an intuitive administration interface and a captivating frontend overlay.

## Features

*   **Backend API:**
    *   Card, Collection, Set, and Drop Rate Management via dedicated services and repositories.
    *   Twitch EventSub Integration for real-time event handling.
    *   Pack Opening Queue for processing interactive pack opening events.
    *   Admin API for managing game data.
*   **Frontend Interface:**
    *   Admin Panel for Card Management.
    *   Admin Panel for Drop Rate Management.
    *   Admin Panel for Set Management.
    *   Interactive Overlay for Twitch streams (displaying pack openings, card collections, etc.).

## Workflow Guidelines

To ensure efficient and high-quality development, this project adheres to the following workflow principles:

### 1. Plan Mode by Default

For any non-trivial work (tasks requiring three or more steps or significant design decisions), a clear plan must be established first. If implementation deviates from the plan or encounters failures, reassess and re-plan before proceeding. Verification steps should always be an integral part of the planning process.

### 2. Task Tracking Discipline

*   **Run Files:** Create a dedicated run file for each significant task in `tasks/runs/YYYY-MM-DD_<slug>.md`. This file should contain a detailed plan, progress updates, and review notes.
*   **Todo Index:** Maintain `tasks/todo.md` as a concise index of active, backlog, and recently completed tasks (typically the latest 20).
*   **Closure:** Ensure all completed runs are properly closed.
*   **Lessons Learned:** After addressing corrections or failures, document prevention rules and insights in `tasks/lessons.md` to foster continuous improvement.

### 3. Verification Before Completion

Before marking any task as complete:

*   **Validate Behavior:** Thoroughly validate that the changed behavior meets all requirements.
*   **Minimal Diffs:** Confirm that code changes (`diffs`) are minimal, focused, and directly address the task at hand.
*   **Staff-Level Review:** Ask yourself: "Would this change pass a staff-level technical review?"

### 4. Elegance and Pragmatism

*   **Simplicity:** Prefer simple, maintainable solutions over overly complex ones.
*   **Refactoring:** Be prepared to refactor "hacky" solutions, especially if they have a high impact on the system's stability or maintainability.
*   **Avoid Over-engineering:** Strive for practical solutions that solve the immediate problem without unnecessary complexity.



## Technologies Used

*   **Backend:**
    *   Node.js (TypeScript)
    *   Express.js
    *   Prisma (ORM for database interaction)
    *   PostgreSQL (database)
    *   Jest (for testing)
*   **Frontend:**
    *   React (TypeScript)
    *   Vite (build tool)
    *   Tailwind CSS (for styling)
    *   ESLint
*   **Deployment/Development Tools:**
    *   Docker / Docker Compose
    *   Git

## Getting Started

### Prerequisites

*   Git
*   Node.js (LTS version recommended)
*   npm or Yarn
*   Docker & Docker Compose (optional, for containerized setup)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Tryphamour/Tryphasing.git
    cd Tryphasing
    ```

2.  **Backend Setup:**
    ```bash
    cd backend
    npm install
    # Create a .env file by referring to the Configuration section below.
    # Configure your database connection in prisma/schema.prisma and .env
    npx prisma migrate dev --name init # Run migrations
    npx prisma db seed # Seed the database with initial data
    npm run dev # Start the backend server
    ```

3.  **Frontend Setup:**
    ```bash
    cd ../frontend
    npm install
    # Create a .env file by referring to the Configuration section below.
    npm run dev # Start the frontend development server
    ```

4.  **Using Docker Compose (Alternative/Recommended for Production):**
    ```bash
    docker-compose up --build # Build and start all services
    ```

## Configuration

Both the `backend` and `frontend` directories require `.env` files for configuration. These files should not be committed to version control.

*   **Backend (`backend/.env`):**
    *   `DATABASE_URL`: Connection string for your PostgreSQL database (e.g., `postgresql://user:password@host:port/database`).
    *   `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_EVENTSUB_SECRET`: Credentials for Twitch API and EventSub.
    *   `PORT`: Port for the backend API (default: `3000`).

*   **Frontend (`frontend/.env`):**
    *   `VITE_API_URL`: URL of your backend API (e.g., `http://localhost:3000/api`).

## Usage

*   **Admin Interface:** Access the frontend application (usually `http://localhost:5173` if running with Vite default) and navigate to the `/admin` routes for managing cards, drop rates, and sets.
*   **Twitch Overlay:** The overlay component (e.g., `/overlay`) can be integrated into your streaming software (like OBS) to display real-time game events and user interactions.

## Running Tests

*   **Backend Tests:**
    ```bash
    cd backend
    npm test # Runs all unit tests
    ```
*   **Frontend Tests:**
    ```bash
    cd frontend
    # As of now, no dedicated test script is configured in frontend/package.json.
    # Frontend testing will be implemented in a future phase.
    ```

## Project Structure



*   `backend/`: Contains the Node.js/Express.js API, Prisma schema, services, repositories, and Twitch integration.

*   `frontend/`: Contains the React application, including the admin interface and the Twitch overlay.

*   `tasks/`: Documentation and notes related to project tasks and runs.

*   `docker-compose.yml`: Defines the multi-container Docker application environment.



## Assistance



This project's initial setup, documentation generation, and configuration guidance were assisted by **Gemini CLI**.



## License

This project is licensed under the MIT License. A `LICENSE` file detailing the terms should be created in the root directory if it does not already exist.