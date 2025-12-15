# Stochi Engine

Go-based interaction analysis engine for Stochi.

## Development

```bash
# Install dependencies
go mod download

# Run locally
make run

# Run with live reload (requires air)
make dev

# Run tests
make test
```

## Environment Variables

- `PORT` - Server port (default: 8080)
- `DATABASE_URL` - PostgreSQL connection string (Neon)

## API Endpoints

### Health Check
```
GET /health
```

Returns server health status.

### Analyze Interactions (Protected)
```
POST /api/analyze
Authorization: Bearer <session_token>

{
  "supplementIds": ["uuid1", "uuid2", ...],
  "includeTiming": true
}
```

Returns interaction analysis with traffic light status.

## Deployment (Fly.io)

### Prerequisites

1. Install Fly CLI: https://fly.io/docs/flyctl/install/
2. Login: `fly auth login`

### First-time Setup (via Terraform)

```bash
cd infra

# Get a deploy token
fly tokens create deploy -x 999999h
export FLY_API_TOKEN="your-token"

# Create the app
terraform init
terraform apply

# Set the database secret
cd ../apps/engine
fly secrets set DATABASE_URL="postgresql://..."

# Deploy
fly deploy
```

### Subsequent Deploys

```bash
cd apps/engine
fly deploy
```

### Manual Setup (without Terraform)

```bash
cd apps/engine

# Create app
fly launch --no-deploy

# Set secret
fly secrets set DATABASE_URL="postgresql://..."

# Deploy
fly deploy
```

### Verify Deployment

```bash
curl https://stochi-engine.fly.dev/health
```

## Architecture

```
apps/engine/
├── cmd/server/          # Entry point
│   └── main.go
├── internal/
│   ├── auth/           # Session validation
│   ├── config/         # Environment config
│   ├── db/             # Database connection
│   ├── handlers/       # HTTP handlers
│   └── models/         # Type definitions
├── Dockerfile          # Multi-stage build
└── fly.toml           # Fly.io config
```
