# Build the Go API binary
FROM golang:1.22 AS builder

ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOTOOLCHAIN=auto

WORKDIR /app

# Download dependencies first for better caching
# Expecting build context to be the project root
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy source
COPY backend ./

# Build the server
RUN go build -o server

# Minimal runtime image
FROM gcr.io/distroless/base-debian12

WORKDIR /app

COPY --from=builder /app/server /app/server

ENV MONGO_URL= \
    MONGO_DB_NAME=event_hub

EXPOSE 8080

USER nonroot:nonroot

CMD ["/app/server"]
