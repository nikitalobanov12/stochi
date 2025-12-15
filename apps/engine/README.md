# Stochi Engine

Go-based interaction analysis engine for Stochi.

## Development

```bash
# Install dependencies
go mod download

# Run locally
make run

# Run with live reload
make dev

# Run tests
make test
```

## Environment Variables

- `PORT` - Server port (default: 8080)
- `DATABASE_URL` - PostgreSQL connection string

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

## Deployment

Deploy to Railway:

```bash
railway up
```

Set environment variables in Railway dashboard:
- `DATABASE_URL` - Neon PostgreSQL connection string
