#!/usr/bin/env bash
set -e

# Development script that:
# 1. Starts the PostgreSQL database container
# 2. Optionally starts the Go engine (if ENGINE_LOCAL=true)
# 3. Runs the Next.js dev server
# 4. Stops everything when the dev server exits

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENGINE_DIR="$(dirname "$PROJECT_DIR")/engine"

cd "$PROJECT_DIR"

# Import env variables
if [ -f .env ]; then
  set -a
  source .env
  set +a
else
  echo "Error: .env file not found"
  exit 1
fi

# Parse database connection info from DATABASE_URL
DB_PASSWORD=$(echo "$DATABASE_URL" | awk -F':' '{print $3}' | awk -F'@' '{print $1}')
DB_PORT=$(echo "$DATABASE_URL" | awk -F':' '{print $4}' | awk -F'/' '{print $1}')
DB_NAME=$(echo "$DATABASE_URL" | awk -F'/' '{print $4}')
DB_CONTAINER_NAME="$DB_NAME-postgres"

ENGINE_PID=""

if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running"
  exit 1
fi

start_db() {
  if [ "$(docker ps -q -f name="$DB_CONTAINER_NAME")" ]; then
    echo "Database '$DB_CONTAINER_NAME' already running"
    if ! docker port "$DB_CONTAINER_NAME" 5432/tcp | grep -q ":$DB_PORT$"; then
      echo "Warning: '$DB_CONTAINER_NAME' is missing host port mapping for $DB_PORT."
      echo "Recreating container with proper port mapping..."
      docker stop "$DB_CONTAINER_NAME" > /dev/null 2>&1 || true
      docker rm "$DB_CONTAINER_NAME" > /dev/null 2>&1 || true
      docker run -d \
        --name "$DB_CONTAINER_NAME" \
        -e POSTGRES_USER="postgres" \
        -e POSTGRES_PASSWORD="$DB_PASSWORD" \
        -e POSTGRES_DB="$DB_NAME" \
        -p "$DB_PORT":5432 \
        postgres > /dev/null
      wait_for_db
    fi
    return 0
  fi

  if [ "$(docker ps -q -a -f name="$DB_CONTAINER_NAME")" ]; then
    echo "Starting database container '$DB_CONTAINER_NAME'..."
    docker start "$DB_CONTAINER_NAME" > /dev/null
    if ! docker port "$DB_CONTAINER_NAME" 5432/tcp | grep -q ":$DB_PORT$"; then
      echo "Warning: '$DB_CONTAINER_NAME' is missing host port mapping for $DB_PORT."
      echo "Recreating container with proper port mapping..."
      docker rm -f "$DB_CONTAINER_NAME" > /dev/null 2>&1 || true
      docker run -d \
        --name "$DB_CONTAINER_NAME" \
        -e POSTGRES_USER="postgres" \
        -e POSTGRES_PASSWORD="$DB_PASSWORD" \
        -e POSTGRES_DB="$DB_NAME" \
        -p "$DB_PORT":5432 \
        postgres > /dev/null
    fi
    wait_for_db
    return 0
  fi

  echo "Creating database container '$DB_CONTAINER_NAME'..."
  docker run -d \
    --name "$DB_CONTAINER_NAME" \
    -e POSTGRES_USER="postgres" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "$DB_PORT":5432 \
    postgres > /dev/null
  wait_for_db
}

wait_for_db() {
  echo "Waiting for database to be ready..."
  for _ in {1..30}; do
    if docker exec "$DB_CONTAINER_NAME" pg_isready -U postgres > /dev/null 2>&1 && \
       (echo > "/dev/tcp/127.0.0.1/$DB_PORT") > /dev/null 2>&1; then
      echo "Database ready"
      return 0
    fi
    sleep 1
  done
  echo "Warning: Database may not be ready yet"
}

start_engine() {
  if [ "$ENGINE_LOCAL" != "true" ]; then
    return 0
  fi

  if [ ! -d "$ENGINE_DIR" ]; then
    echo "Warning: Engine directory not found at $ENGINE_DIR"
    return 0
  fi

  # Check if Go is installed
  if ! command -v go &> /dev/null; then
    echo "Warning: Go is not installed, skipping local engine"
    return 0
  fi

  echo "Starting Go engine on port 8080..."
  
  # Run engine with local database and shared internal key
  cd "$ENGINE_DIR"
  PORT=8080 \
  DATABASE_URL="$DATABASE_URL" \
  INTERNAL_KEY="$ENGINE_INTERNAL_KEY" \
  go run ./cmd/server &
  ENGINE_PID=$!
  cd "$PROJECT_DIR"

  # Wait briefly and verify the process is still alive
  sleep 2
  if ! kill -0 "$ENGINE_PID" 2>/dev/null; then
    echo "Warning: Go engine exited during startup. Continuing without local engine."
    ENGINE_PID=""
    return 0
  fi

  echo "Go engine started (PID: $ENGINE_PID)"
}

stop_engine() {
  if [ -n "$ENGINE_PID" ] && kill -0 "$ENGINE_PID" 2>/dev/null; then
    echo "Stopping Go engine (PID: $ENGINE_PID)..."
    kill "$ENGINE_PID" 2>/dev/null || true
    wait "$ENGINE_PID" 2>/dev/null || true
  fi
}

stop_db() {
  echo ""
  echo "Stopping database container '$DB_CONTAINER_NAME'..."
  docker stop "$DB_CONTAINER_NAME" > /dev/null 2>&1 || true
}

cleanup() {
  stop_engine
  stop_db
}

trap cleanup EXIT

start_db
start_engine

echo "Starting Next.js dev server..."
echo ""
# Suppress TimeoutNegativeWarning from Next.js 16 internal scheduler (cosmetic issue)
NODE_OPTIONS="--no-warnings=TimeoutNegativeWarning" bun next dev --turbo
