# Jenkins Pipeline Guide – AfriMart DevOps

This guide explains how to run the AfriMart CI/CD pipeline successfully in Jenkins.

---

## Overview

The pipeline runs **Checkout → Install Node.js → Install Dependencies → Run Tests (and Lint)** and optionally Security Scan, Docker builds, ECR push, and deployment. It does **not** require the NodeJS plugin or Docker plugin; Node.js is installed inline per build.

---

## Prerequisites

- Jenkins (LTS recommended)
- Git
- `curl` and `tar` (for Node.js download)
- Network access to:
  - GitHub (for checkout)
  - nodejs.org (for Node.js download)
  - npm registry (for `npm ci`)

---

## 1. Run Jenkins

### Option A: Jenkins in Docker

```bash
docker run -d \
  --name jenkins \
  -p 9090:8080 \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

- UI: **http://localhost:9090**
- First run: unlock with the initial admin password from the container logs.

### Option B: Native install

- Install Jenkins for your OS: <https://www.jenkins.io/download/>
- Default UI: **http://localhost:8080**

---

## 2. Create the Pipeline Job

1. **New Item** → name: `afrimart-pipeline`
2. Select **Pipeline**
3. **OK**
4. Under **Pipeline**:
   - **Definition:** Pipeline script from SCM
   - **SCM:** Git
   - **Repository URL:** `https://github.com/Frankznation/afrimart-devops`
   - **Branch:** `*/main`
   - **Script Path:** `Jenkinsfile`
5. **Save**

---

## 3. Run the Pipeline

1. Open **afrimart-pipeline**
2. Click **Build Now**
3. Check **Console Output** for progress

---

## 4. Pipeline Stages

| Stage              | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| **Checkout**       | Clones the repo from GitHub                                                 |
| **Install Node.js**| Downloads Node 18 from nodejs.org and extracts into the workspace          |
| **Install Dependencies** | Runs `npm ci` in `backend` and `frontend`                          |
| **Run Tests**      | Jest (backend) + Vitest (frontend), then ESLint for both                    |
| **Security Scan**  | Docker build + Trivy scan (skipped if Docker is unavailable)                |
| **Build Docker Images** | Builds backend and frontend images (skipped if Docker unavailable)   |
| **Push to ECR**    | Placeholder for ECR push (when `main`/`master`)                             |
| **Deploy to Staging** | Runs Ansible deploy (when `main`/`master`)                              |
| **Manual Approval**| Waits for approval before production deploy                                 |
| **Deploy to Production** | Placeholder for production deploy                                       |
| **Post-Deployment Tests** | Health check via `curl`                                               |

---

## 5. Architecture Decisions

### No NodeJS Plugin

The pipeline installs Node.js inline instead of using the Jenkins NodeJS plugin:

- No plugin configuration in Jenkins
- Works on any agent with `curl` and `tar`
- Uses Node 18.20.4 for Linux (x64/arm64) or macOS (x64/arm64)

### No Docker Plugin

- Pipeline uses `agent any` (no Docker agent type)
- Security Scan and Build Docker Images are skipped when the `docker` command is missing
- Core stages (install, test, lint) still run

### ESLint Configuration

- **Backend:** `backend/.eslintrc.cjs` – Node/ES2022, Jest env for tests
- **Frontend:** `frontend/.eslintrc.cjs` – React/Browser

---

## 6. Troubleshooting

### Pipeline fails with "node: command not found"

- Node install runs in **Install Node.js** before any npm steps.
- Confirm that stage finishes and that `PATH` includes `$WORKSPACE/node/bin`.

### "tar: xz: Cannot exec"

- The agent lacked `xz`. The pipeline was updated to use `.tar.gz` instead.

### "Tool type 'nodejs' does not have an install of 'NodeJS 18'"

- You do not need the NodeJS plugin with the current Jenkinsfile. The pipeline installs Node inline.

### "Invalid agent type 'docker' specified"

- The Docker Pipeline plugin is not required. The Jenkinsfile uses `agent any`.

### ESLint: "describe/it/expect is not defined"

- Jest globals are enabled for test files via `backend/.eslintrc.cjs` overrides.

### Jenkins runs on ARM (e.g. M1/M2)

- The Node install script selects `linux-arm64` or `darwin-arm64` automatically.

---

## 7. Optional: Enable Docker Stages

To run Security Scan and Build Docker Images:

1. Ensure Docker is installed on the Jenkins agent.
2. If Jenkins runs in Docker, mount the Docker socket:

   ```bash
   docker run -d \
     --name jenkins \
     -p 9090:8080 \
     -v jenkins_home:/var/jenkins_home \
     -v /var/run/docker.sock:/var/run/docker.sock \
     jenkins/jenkins:lts
   ```

3. Install the **Docker Pipeline** plugin and configure Docker in Jenkins (optional, if you later switch to a Docker agent).

---

## 8. Repo Structure

```
afrimart-devops/
├── Jenkinsfile
├── backend/
│   ├── .eslintrc.cjs
│   ├── package.json
│   └── src/
├── frontend/
│   ├── .eslintrc.cjs
│   ├── package.json
│   └── src/
├── docs/
│   ├── JENKINS_PIPELINE_GUIDE.md   # This file
│   └── JENKINS_SETUP.md
└── scripts/
    └── install-jenkins-nodejs-plugin.sh
```

---

## 9. Success Checklist

- [ ] Jenkins is running and reachable
- [ ] Pipeline job created with correct Git URL and branch
- [ ] **Checkout** completes
- [ ] **Install Node.js** downloads and extracts Node 18
- [ ] **Install Dependencies** runs `npm ci` for backend and frontend
- [ ] **Run Tests** passes Jest, Vitest, and ESLint
- [ ] Pipeline status shows **Success** (green)
