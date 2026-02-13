# Phase 3: Containerization

This document covers the Docker implementation for AfriMart, including Dockerfiles, docker-compose, ECR, and best practices.

---

## 1. Docker Implementation

### Backend Dockerfile

- **Multi-stage build**: Builder stage installs dependencies, production stage copies only `node_modules` and app code
- **Pinned base image**: `node:18.20.4-alpine3.19` for reproducibility
- **Non-root user**: Runs as `nodejs` (UID 1001)
- **Health check**: HTTP GET to `/health` every 30s
- **Minimal layers**: Combined RUN where practical

### Frontend Dockerfile

- **Multi-stage build**: Builder compiles Vite/React, production stage uses nginx to serve static files
- **Pinned base images**: `node:18.20.4-alpine3.19` (build), `nginx:1.25.4-alpine` (runtime)
- **Health check**: HTTP GET to `/health.html` every 30s
- **Build arg**: `VITE_API_URL` passed at build time for API endpoint

### docker-compose (Local Development)

Located at `docker/docker-compose.yml`:

| Service   | Image                     | Ports  | Purpose                    |
|-----------|---------------------------|--------|----------------------------|
| postgres  | postgres:14.11-alpine     | 5433   | PostgreSQL database        |
| redis     | redis:7.2.4-alpine        | 6380   | Redis cache                |
| backend   | built from ../backend     | 5001   | Node.js API                |
| frontend  | built from ../frontend    | 3001   | React/Vite SPA             |
| nginx     | nginx:1.25.4-alpine       | 80     | Reverse proxy (profile: production) |

**Logging**: All services use `json-file` driver with `max-size: 10m`, `max-file: 3`.

**Usage:**
```bash
cd docker
docker compose up -d
# Frontend: http://localhost:3001
# Backend API: http://localhost:5001
# With nginx: docker compose --profile production up -d → http://localhost:80
```

---

## 2. Amazon ECR

### Terraform Module

The `terraform/modules/ecr` module creates:

- **afrimart/backend** – Backend API image repository
- **afrimart/frontend** – Frontend image repository

### Features

| Feature           | Configuration                                |
|-------------------|----------------------------------------------|
| Image scanning    | `scan_on_push = true` (vulnerability scans)  |
| Encryption        | AES256 at rest                              |
| Lifecycle policy  | Keep last 10 images, expire older           |

### Image Tagging Strategy

| Tag          | Use case                          |
|--------------|-----------------------------------|
| `latest`     | Development, manual testing       |
| `v1.0.0`     | Semantic version for releases     |
| `sha-abc123` | Git commit SHA (CI/CD)            |
| `staging`    | Staging environment               |

### Push to ECR

```bash
# Authenticate
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-north-1.amazonaws.com

# Build and tag
docker build -t afrimart/backend:latest ./backend
docker tag afrimart/backend:latest <account-id>.dkr.ecr.eu-north-1.amazonaws.com/afrimart/backend:latest

# Push
docker push <account-id>.dkr.ecr.eu-north-1.amazonaws.com/afrimart/backend:latest
```

Replace `<account-id>` with your AWS account ID. Get ECR URLs from Terraform:

```bash
cd terraform/environments/dev
terraform output ecr_backend_url
terraform output ecr_frontend_url
```

---

## 3. Docker Best Practices Applied

| Practice              | Implementation                                      |
|-----------------------|-----------------------------------------------------|
| Minimize image size   | Alpine base images, multi-stage builds, no dev deps in prod |
| Non-root user         | Backend: `nodejs` (1001); Frontend: nginx default   |
| .dockerignore         | Excludes node_modules, .env, tests, coverage        |
| Pinned versions       | node:18.20.4-alpine3.19, nginx:1.25.4-alpine        |
| Health checks         | All services have HEALTHCHECK                       |
| Logging               | json-file with size limits in docker-compose        |

---

## 4. Image Size Comparison

Run the following to compare image sizes before/after optimization:

```bash
# Build images
docker build -t afrimart-backend:test ./backend
docker build -t afrimart-frontend:test ./frontend

# Report sizes
docker images afrimart-backend:test afrimart-frontend:test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

**Expected approximate sizes (Alpine-based):**

| Image   | Approx Size |
|---------|-------------|
| Backend | ~150–200 MB |
| Frontend| ~25–40 MB   |

---

## 5. Security

- **ECR scan on push**: Enabled; view findings in ECR console
- **Trivy** (Phase 4): Can be added to CI for pre-push scanning
- **Secrets**: Never copy `.env` into images; use runtime env or secrets manager
