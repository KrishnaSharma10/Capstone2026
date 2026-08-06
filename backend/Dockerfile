#Angad Dhawan 
# ---------- Build stage ----------
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy dependency files first and download deps (this layer is cached
# so rebuilds are fast when only your source code changes)
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of your source code
COPY . .

# Build a self-contained binary from the ./cmd package.
# CGO_ENABLED=0 makes a static binary that runs on a tiny base image.
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd

# ---------- Run stage ----------
FROM alpine:latest

WORKDIR /app

# SSL root certificates — REQUIRED so the app can make TLS connections
# to MongoDB Atlas, Gmail SMTP, Resend, and Cloudinary. Without this
# you'll get x509 certificate errors at runtime.
RUN apk add --no-cache ca-certificates

# Copy only the compiled binary from the build stage (keeps image small)
COPY --from=builder /app/server .

# Documents the port; the actual port is set by your PORT env var
EXPOSE 10000

CMD ["./server"]