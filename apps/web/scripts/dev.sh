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

# Detect docker/podman
if [ -x "$(command -v docker)" ]; then
  DOCKER_CMD="docker"
elif [ -x "$(command -v podman)" ]; then
  DOCKER_CMD="podman"
else
  echo "Error: Docker or Podman is not installed"
  exit 1
fi

# Check if docker daemon is running
if ! $DOCKER_CMD info > /dev/null 2>&1; then
  echo "Error: $DOCKER_CMD daemon is not running"
  exit 1
fi

start_db() {
  # Already running
  if [ "$($DOCKER_CMD ps -q -f name="$DB_CONTAINER_NAME")" ]; then
    echo "Database '$DB_CONTAINER_NAME' already running"
    return 0
  fi

  # Exists but stopped - start it
  if [ "$($DOCKER_CMD ps -q -a -f name="$DB_CONTAINER_NAME")" ]; then
    echo "Starting database container '$DB_CONTAINER_NAME'..."
    $DOCKER_CMD start "$DB_CONTAINER_NAME" > /dev/null
    wait_for_db
    return 0
  fi

  # Create new container
  echo "Creating database container '$DB_CONTAINER_NAME'..."
  $DOCKER_CMD run -d \
    --name "$DB_CONTAINER_NAME" \
    -e POSTGRES_USER="postgres" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "$DB_PORT":5432 \
    docker.io/postgres > /dev/null
  wait_for_db
}

wait_for_db() {
  echo "Waiting for database to be ready..."
  for _ in {1..30}; do
    if $DOCKER_CMD exec "$DB_CONTAINER_NAME" pg_isready -U postgres > /dev/null 2>&1; then
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
  $DOCKER_CMD stop "$DB_CONTAINER_NAME" > /dev/null 2>&1 || true
}

# Trap to stop database on script exit
trap stop_db EXIT

# Start database
start_db

# Run the dev server (not exec, so trap can fire)
echo "Starting Next.js dev server..."
echo ""
bun next dev --turbo
