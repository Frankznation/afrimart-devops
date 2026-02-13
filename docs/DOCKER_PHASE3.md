# Phase 3: Containerization – Guidelines & Documentation

This document provides guidelines, step-by-step instructions, and reference material for the AfriMart Phase 3 containerization implementation.

---

## Table of Contents

1. [Overview](#overview)
2. [Implementation Checklist](#implementation-checklist)
3. [Docker Implementation](#docker-implementation)
4. [Container Registry (ECR)](#container-registry-ecr)
5. [Docker Best Practices](#docker-best-practices)
6. [Quick Reference](#quick-reference)
7. [Evaluation Criteria](#evaluation-criteria)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Phase 3 covers:

- **Docker Implementation** – Optimized Dockerfiles, docker-compose for local dev
- **Container Registry** – Amazon ECR with scanning and lifecycle policies
- **Best Practices** – Image size, security, non-root users, .dockerignore

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Optimized Dockerfiles | `backend/Dockerfile`, `frontend/Dockerfile` |
| docker-compose.yml | `docker/docker-compose.yml` |
| ECR Terraform module | `terraform/modules/ecr/` |
| Documentation | This file |

---

## Implementation Checklist

### Docker Implementation

- [x] Review and optimize provided Dockerfiles
- [x] Create docker-compose for local development
- [x] Implement multi-stage builds
- [x] Add health checks to containers
- [x] Configure proper logging

### Container Registry (ECR)

- [x] Set up Amazon ECR repositories (Terraform)
- [x] Implement image tagging strategy
- [x] Configure image scanning (scan_on_push)
- [x] Set up lifecycle policies (keep last 10)

### Docker Best Practices

- [x] Minimize image size (Alpine, multi-stage)
- [x] Use non-root users
- [x] Implement .dockerignore
- [x] Pin base image versions

---

## Docker Implementation

### Backend Dockerfile

**Location:** `backend/Dockerfile`

| Aspect | Implementation |
|--------|----------------|
| Multi-stage build | Builder installs deps, production copies only needed files |
| Base image | `node:18.20.4-alpine3.19` (pinned) |
| Non-root user | `nodejs` (UID 1001) |
| Health check | GET `/health` every 30s, 3 retries |
| CMD | `node src/server.js` |

### Frontend Dockerfile

**Location:** `frontend/Dockerfile`

| Aspect | Implementation |
|--------|----------------|
| Multi-stage build | Builder compiles Vite, production serves via nginx |
| Base images | `node:18.20.4-alpine3.19` (build), `nginx:1.25.4-alpine` (runtime) |
| Build arg | `VITE_API_URL` – set at build time for API endpoint |
| Health check | GET `/health.html` every 30s |
| CMD | `nginx -g daemon off` |

### docker-compose (Local Development)

**Location:** `docker/docker-compose.yml`

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| postgres | postgres:14.11-alpine | 5433 | Database |
| redis | redis:7.2.4-alpine | 6380 | Cache |
| backend | built from ../backend | 5001 | API |
| frontend | built from ../frontend | 3001 | Web UI |
| nginx | nginx:1.25.4-alpine | 80 | Reverse proxy (profile: production) |

**Logging:** `json-file` driver, `max-size: 10m`, `max-file: 3` for all services.

#### Usage

```bash
# Start all services (dev mode)
cd docker
docker compose up -d

# Access
# Frontend: http://localhost:3001
# Backend:  http://localhost:5001

# With nginx reverse proxy (production-like)
docker compose --profile production up -d
# Single entry: http://localhost:80

# Stop
docker compose down
```

---

## Container Registry (ECR)

### Terraform Module

**Location:** `terraform/modules/ecr/`

Creates two repositories:

- `afrimart/backend`
- `afrimart/frontend`

### Features

| Feature | Configuration |
|---------|---------------|
| Image scanning | `scan_on_push = true` (CVE scanning) |
| Encryption | AES256 at rest |
| Lifecycle policy | Keep last 10 images, expire older |

### Apply ECR (Terraform)

```bash
cd terraform/environments/dev
terraform init
terraform apply -var="db_password=YourPassword"  # ECR created with other resources
terraform output ecr_backend_url
terraform output ecr_frontend_url
```

### Image Tagging Strategy

| Tag | Use case |
|-----|----------|
| `latest` | Development, manual builds |
| `v1.0.0` | Release versions |
| `sha-<commit>` | CI/CD (e.g. `sha-abc1234`) |
| `staging` | Staging environment |

### Push Images to ECR

```bash
# 1. Authenticate (replace <account-id> with your AWS account ID)
aws ecr get-login-password --region eu-north-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.eu-north-1.amazonaws.com

# 2. Build
docker build -t afrimart/backend:latest ./backend
docker build -t afrimart/frontend:latest ./frontend

# 3. Tag for ECR (use URL from terraform output)
ECR_URL=$(cd terraform/environments/dev && terraform output -raw ecr_backend_url)
docker tag afrimart/backend:latest $ECR_URL:latest

# 4. Push
docker push $ECR_URL:latest
```

---

## Docker Best Practices

| Practice | Implementation |
|----------|----------------|
| **Minimize image size** | Alpine base, multi-stage, no devDependencies in prod |
| **Non-root user** | Backend: `nodejs`, Frontend: nginx default |
| **.dockerignore** | Excludes node_modules, .env, tests, coverage, .git |
| **Pinned versions** | All images use specific tags (e.g. 18.20.4-alpine3.19) |
| **Health checks** | All services have HEALTHCHECK in Dockerfile and compose |
| **Logging** | Size-limited json-file driver in docker-compose |
| **Secrets** | Never bake .env into images; use runtime env |

### .dockerignore

Both `backend/.dockerignore` and `frontend/.dockerignore` exclude:

- `node_modules`, `npm-debug.log*`
- `.env`, `.env.*`
- `.git`, `.gitignore`
- `coverage`, `*.test.js`, `*.spec.js`
- `logs`, `uploads/*`, `dist`

---

## Quick Reference

### Build Images

```bash
docker build -t afrimart-backend:test ./backend
docker build -t afrimart-frontend:test ./frontend
```

### Image Size Report

```bash
docker images afrimart-backend afrimart-frontend --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

**Expected:** Backend ~150–200 MB, Frontend ~25–40 MB

### Local Test (Full Stack)

```bash
cd docker
docker compose up -d
curl http://localhost:5001/health
curl http://localhost:3001
```

---

## Evaluation Criteria

| Criterion | Weight | How We Addressed It |
|-----------|--------|---------------------|
| **Image optimization** | 30% | Alpine base, multi-stage builds, .dockerignore |
| **Security practices** | 30% | Non-root users, ECR scan on push, no secrets in images |
| **Build efficiency** | 20% | Multi-stage, cached layers, minimal deps |
| **Documentation** | 20% | This doc, inline comments, README references |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails: `npm ci` | Ensure `package-lock.json` exists and is committed |
| Frontend blank / wrong API | Set `VITE_API_URL` build arg correctly (e.g. `http://localhost:5001/api`) |
| Health check fails | Backend must expose `/health`; frontend serves `/health.html` |
| ECR push denied | Run `aws ecr get-login-password` and `docker login` |
| Port in use | Change host ports in docker-compose (e.g. 5434:5432) |
| Large image size | Ensure .dockerignore excludes node_modules, use `docker system prune` |

---

## Related Documentation

- [DEVOPS_GUIDE.md](DEVOPS_GUIDE.md) – Terraform + Ansible
- [../README.md](../README.md) – Repository overview
