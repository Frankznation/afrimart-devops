# Jenkins Pipeline Guide – AfriMart DevOps

This guide explains how to run the AfriMart CI/CD pipeline successfully in Jenkins.

---

## Overview

The pipeline runs **Checkout → Install Node.js → Install Dependencies → Run Tests (and Lint) → Security Scan → Build Frontend → Deploy to Staging → Manual Approval → Deploy to Production → Post-Deployment Tests**. It optionally sends **Slack notifications** on success/failure. It does **not** require the NodeJS plugin or Docker plugin; Node.js is installed inline per build.

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

## 3. Configure Credentials

### AWS Credentials (for ECR Push)

1. **Manage Jenkins** → **Credentials** → **Add Credentials**
2. **Kind:** Username with password
3. **Username:** Your AWS Access Key ID
4. **Password:** Your AWS Secret Access Key
5. **ID:** `aws-credentials`
6. **Save**

> **Note:** Push to ECR requires Docker and AWS CLI on the Jenkins agent. If not available, the stage will fail gracefully.

### Slack Notifications

1. **Manage Jenkins** → **Script Console**
2. Paste and run the script from `scripts/add-slack-webhook-credential.groovy` (replace `YOUR_WEBHOOK_URL` with your Slack webhook).
3. Or add manually: **Credentials** → **Add** → **Secret text** → ID: `slack-webhook`, Secret: your webhook URL.

**Get a Slack webhook:** [api.slack.com/apps](https://api.slack.com/apps) → Create App → Incoming Webhooks → Add to Workspace → Copy webhook URL.

---

## 4. Run the Pipeline

1. Open **afrimart-pipeline**
2. Click **Build Now**
3. Monitor progress in **Console Output**
4. When the pipeline reaches **Manual Approval**, click **Deploy** in the build page to continue (or **Abort** to stop)

---

## 5. Pipeline Stages

| Stage                  | Description                                                                 |
|------------------------|-----------------------------------------------------------------------------|
| **Checkout**           | Clones the repo from GitHub                                                 |
| **Install Node.js**    | Downloads Node 18 from nodejs.org and extracts into the workspace          |
| **Install Dependencies** | Runs `npm ci` in `backend` and `frontend`                              |
| **Run Tests**          | Jest (backend) + Vitest (frontend), then ESLint for both                    |
| **Security Scan**      | npm audit (OWASP dependency scan) + Trivy (image scan when Docker available)|
| **Build Docker Images**| Builds backend and frontend images (skipped if Docker unavailable)          |
| **Push to ECR**        | Pushes images to ECR (requires Docker + AWS CLI + `aws-credentials`)        |
| **Build Frontend**     | `npm run build` for Ansible deploy                                          |
| **Deploy to Staging**  | Ansible deploy to staging                                                   |
| **Manual Approval**    | Waits for you to click **Deploy** before production                         |
| **Deploy to Production** | Ansible deploy to production                                             |
| **Post-Deployment Tests** | Health check via `curl`                                                 |
| **Notifications**      | Slack (via curl to webhook when `slack-webhook` credential exists)          |

---

## 6. Architecture Decisions

### No NodeJS Plugin

The pipeline installs Node.js inline instead of using the Jenkins NodeJS plugin:

- No plugin configuration in Jenkins
- Works on any agent with `curl` and `tar`
- Uses Node 18.20.4 for Linux (x64/arm64) or macOS (x64/arm64)

### No Docker Plugin

- Pipeline uses `agent any` (no Docker agent type)
- Security Scan and Build Docker Images are skipped when the `docker` command is missing
- Push to ECR requires Docker and AWS CLI on the agent

### Slack via Webhook (No Plugin)

- Uses `withCredentials` to inject the `slack-webhook` secret
- Sends a curl POST to the webhook on success/failure
- No Slack Notification plugin required

### ECR Registry

- `ECR_REGISTRY` is set in the Jenkinsfile environment (edit for your AWS account)
- Credential ID `aws-credentials` must be Username/Password (Access Key = username, Secret Key = password)

---

## 7. Manual Approval

When the pipeline reaches the **Manual Approval** stage:

1. Open the running build (click the build number)
2. You will see **"Deploy to Production?"** with **Deploy** and **Abort** buttons
3. Click **Deploy** to continue to production, or **Abort** to stop

---

## 8. Troubleshooting

### Pipeline fails with "node: command not found"

- Node install runs in **Install Node.js** before any npm steps.
- Confirm that stage finishes and that `PATH` includes `$WORKSPACE/node/bin`.

### "tar: xz: Cannot exec"

- The agent lacked `xz`. The pipeline uses `.tar.gz` instead.

### "Tool type 'nodejs' does not have an install of 'NodeJS 18'"

- You do not need the NodeJS plugin. The pipeline installs Node inline.

### "Invalid agent type 'docker' specified"

- The Docker Pipeline plugin is not required. The Jenkinsfile uses `agent any`.

### ESLint: "describe/it/expect is not defined"

- Jest globals are enabled for test files via `backend/.eslintrc.cjs` overrides.

### Jenkins runs on ARM (e.g. M1/M2)

- The Node install script selects `linux-arm64` or `darwin-arm64` automatically.

### Push to ECR: "aws: not found" or "docker: not found"

- The Jenkins agent does not have AWS CLI or Docker installed.
- To enable: run Jenkins with Docker socket mounted, and install AWS CLI in the agent image/container.

### Slack notifications not received

- Ensure the `slack-webhook` credential exists (Secret text) with your webhook URL.
- Run the script in `scripts/add-slack-webhook-credential.groovy` (with your URL) in Script Console.

### AmazonWebServicesCredentialsBinding not found

- Use **Username/Password** credential with ID `aws-credentials` (username = Access Key, password = Secret Key).

---

## 9. Optional: Enable Docker and ECR

To run Build Docker Images and Push to ECR:

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

3. Install AWS CLI inside the Jenkins container (or use an agent with it pre-installed).
4. Ensure ECR repositories exist: `afrimart-backend`, `afrimart-frontend`.

---

## 10. Repo Structure

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
    ├── add-slack-webhook-credential.groovy   # Template for Slack credential
    └── install-jenkins-nodejs-plugin.sh
```

---

## 11. Success Checklist

- [ ] Jenkins is running and reachable
- [ ] Pipeline job created with correct Git URL and branch
- [ ] **Checkout** completes
- [ ] **Install Node.js** downloads and extracts Node 18
- [ ] **Install Dependencies** runs `npm ci` for backend and frontend
- [ ] **Run Tests** passes Jest, Vitest, and ESLint
- [ ] **Build Frontend** succeeds
- [ ] **Manual Approval** – click Deploy when prompted
- [ ] Pipeline status shows **Success** (green)
- [ ] Slack notifications received (if `slack-webhook` configured)
