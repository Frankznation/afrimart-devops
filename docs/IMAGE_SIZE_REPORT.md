# AfriMart Docker Image Size Comparison Report

**Phase 3 Deliverable – Image Optimization**

---

## Overview

This report documents the size of AfriMart backend and frontend Docker images after optimization (multi-stage builds, Alpine base, .dockerignore, minimal dependencies).

---

## Image Size Results

### Current (Optimized) Images

| Image | Tag | Size | Base |
|-------|-----|------|------|
| afrimart/backend | latest | ~180 MB | node:18.20.4-alpine3.19 |
| afrimart/frontend | latest | ~30 MB | nginx:1.25.4-alpine |

### Generate This Report

Run after building images:

```bash
# Build images
docker build -t afrimart/backend:latest ./backend
docker build -t afrimart/frontend:latest ./frontend

# Get sizes
docker images afrimart/backend afrimart/frontend --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

Expected output format:

```
REPOSITORY        TAG       SIZE
afrimart/backend  latest    180MB
afrimart/frontend latest    30MB
```

---

## Optimization Techniques Applied

| Technique | Impact |
|-----------|--------|
| **Alpine base** | ~60% smaller than Debian-based node image |
| **Multi-stage builds** | No devDependencies or build tools in final image |
| **.dockerignore** | Excludes node_modules, tests, coverage, .git from context |
| **Pinned versions** | Reproducible, no surprise bloat from base updates |
| **Backend: production deps only** | `npm ci --omit=dev` – no test/build tooling |
| **Frontend: static nginx** | Only built dist + nginx, no Node.js in runtime |

---

## Size Comparison (Estimated)

| Variant | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Unoptimized (node:18 + full npm install) | ~1.2 GB | ~800 MB | Includes devDeps, no multi-stage |
| Partially optimized (Alpine, single-stage) | ~350 MB | ~150 MB | Still has dev deps in backend |
| **Current (optimized)** | **~180 MB** | **~30 MB** | Multi-stage, Alpine, minimal deps |

---

## Record Your Measurements

After building, record actual sizes here:

| Image | Measured Size | Date |
|-------|---------------|------|
| afrimart/backend | __________ | __________ |
| afrimart/frontend | __________ | __________ |

---

## Related

- [DOCKER_PHASE3.md](DOCKER_PHASE3.md) – Full Phase 3 documentation
- [Evaluation criteria](DOCKER_PHASE3.md#evaluation-criteria) – Image optimization 30% weight
