#!/usr/bin/env bash
set -e

# Development script that:
# 1. Starts the PostgreSQL database container
# 2. Runs the Next.js dev server
# 3. Stops the database when the dev server exits

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

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

if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running"
  exit 1
fi

start_db() {
  if [ "$(docker ps -q -f name="$DB_CONTAINER_NAME")" ]; then
    echo "Database '$DB_CONTAINER_NAME' already running"
    return 0
  fi

  if [ "$(docker ps -q -a -f name="$DB_CONTAINER_NAME")" ]; then
    echo "Starting database container '$DB_CONTAINER_NAME'..."
    docker start "$DB_CONTAINER_NAME" > /dev/null
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
    if docker exec "$DB_CONTAINER_NAME" pg_isready -U postgres > /dev/null 2>&1; then
      echo "Database ready"
      return 0
    fi
    sleep 1
  done
  echo "Warning: Database may not be ready yet"
}

stop_db() {
  echo ""
  echo "Stopping database container '$DB_CONTAINER_NAME'..."
  docker stop "$DB_CONTAINER_NAME" > /dev/null 2>&1 || true
}

trap stop_db EXIT

start_db

echo "Starting Next.js dev server..."
echo ""
bun next dev --turbo
