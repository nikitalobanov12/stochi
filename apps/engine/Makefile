.PHONY: build run dev test clean

# Build the binary
build:
	go build -o bin/server ./cmd/server

# Run the server
run: build
	./bin/server

# Run with live reload (requires air: go install github.com/cosmtrek/air@latest)
dev:
	air

# Run tests
test:
	go test -v ./...

# Clean build artifacts
clean:
	rm -rf bin/

# Download dependencies
deps:
	go mod download

# Tidy dependencies
tidy:
	go mod tidy

# Build Docker image
docker-build:
	docker build -t stochi-engine .

# Run Docker container
docker-run:
	docker run -p 8080:8080 --env-file .env stochi-engine
