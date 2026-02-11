# Makefile for Tryphasing Project

.PHONY: install install-backend install-frontend db-up db-down db-migrate db-seed backend-dev frontend-dev dev backend-test clean

# Install all dependencies for both backend and frontend
install: install-backend install-frontend

# Install backend dependencies
install-backend:
	@echo "Installing backend dependencies..."
	@cd backend && npm install

# Install frontend dependencies
install-frontend:
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install

# Start the PostgreSQL database using Docker Compose
# Prerequisite: Docker Desktop must be running.
db-up:
	@echo "Starting PostgreSQL database with Docker Compose..."
	@docker compose up -d

# Stop and remove the PostgreSQL database container
db-down:
	@echo "Stopping PostgreSQL database with Docker Compose..."
	@docker compose down

# Apply Prisma database migrations
# Ensures the database schema is up-to-date.
db-migrate:
	@echo "Applying Prisma database migrations..."
	@cd backend && npx prisma migrate dev --name init

# Seed the database with initial placeholder data
db-seed:
	@echo "Seeding the database with initial data..."
	@cd backend && npm run seed

# Start the backend development server
backend-dev:
	@echo "Starting backend development server..."
	@cd backend && npm run dev

# Start the frontend development server
frontend-dev:
	@echo "Starting frontend development server..."
	@cd frontend && npm run dev

# Start both backend and frontend development servers
dev:
	@echo "To start both backend and frontend, please run the following commands in separate terminal windows:"
	@echo "  make backend-dev"
	@echo "  make frontend-dev"

# Run backend unit tests
backend-test:
	@echo "Running backend unit tests..."
	@cd backend && npm test

# Clean up node_modules directories in both backend and frontend
clean:
	@echo "Cleaning node_modules directories..."
	@rm -rf backend/node_modules frontend/node_modules
	@echo "Cleaned."
