#!/usr/bin/env bash
set -e

# Stop the database container

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

if [ "$($DOCKER_CMD ps -q -f name=$DB_CONTAINER_NAME)" ]; then
  echo "Stopping database container '$DB_CONTAINER_NAME'..."
  $DOCKER_CMD stop "$DB_CONTAINER_NAME" > /dev/null
  echo "Database stopped"
else
  echo "Database container '$DB_CONTAINER_NAME' is not running"
fi
