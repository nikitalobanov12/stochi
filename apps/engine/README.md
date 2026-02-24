# Stochi Engine (`apps/engine`)

This is the Go service that runs compute-heavy interaction analysis.

## Development

```bash
go mod download
make run
```

Live reload (requires `air`):

```bash
make dev
```

Tests:

```bash
make test
```

## Environment variables

- `PORT` - server port (default: 8080)
- `DATABASE_URL` - PostgreSQL connection string

## API endpoints

Health:

```text
GET /health
```

Analyze interactions (protected):

```text
POST /api/analyze
Authorization: Bearer <session_token>

{
  "supplementIds": ["uuid1", "uuid2"],
  "includeTiming": true
}
```

## Deployment (Fly.io)

Prereqs:

1. Install Fly CLI: https://fly.io/docs/flyctl/install/
2. `fly auth login`

First-time setup (Terraform):

```bash
cd infra

fly tokens create deploy -x 999999h
export FLY_API_TOKEN="<fly_api_token>"

terraform init
terraform apply

cd ../apps/engine
fly secrets set DATABASE_URL="<database_url>"
fly deploy
```

Deploy after that:

```bash
cd apps/engine
fly deploy
```

Manual setup (no Terraform):

```bash
cd apps/engine

fly launch --no-deploy
fly secrets set DATABASE_URL="<database_url>"
fly deploy
```

Verify:

```bash
curl https://stochi-engine.fly.dev/health
```

## Layout

```text
apps/engine/
|-- cmd/server/           Entry point
|   `-- main.go
|-- internal/
|   |-- auth/             Session validation
|   |-- config/           Environment config
|   |-- db/               Database connection
|   |-- handlers/         HTTP handlers
|   `-- models/           Type definitions
|-- Dockerfile            Multi-stage build
`-- fly.toml              Fly.io config
```
