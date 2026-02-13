# Phase 4: CI/CD Pipeline – Guidelines & Documentation

This document provides guidelines for implementing the AfriMart CI/CD pipeline with Jenkins.

---

## Table of Contents

1. [Overview](#overview)
2. [Implementation Checklist](#implementation-checklist)
3. [Jenkins Setup](#jenkins-setup)
4. [Pipeline Stages](#pipeline-stages)
5. [Testing Integration](#testing-integration)
6. [Deployment Automation](#deployment-automation)
7. [Evaluation Criteria](#evaluation-criteria)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Phase 4 covers:

- **Jenkins** – Install, configure, plugins, credentials, GitHub webhooks
- **Pipeline** – Jenkinsfile with stages from checkout to production deploy
- **Testing** – Unit, integration, ESLint, coverage
- **Security** – OWASP, Trivy scanning
- **Deployment** – Staging (auto), production (manual gate), rollback

### Deliverables

| Deliverable | Description |
|-------------|-------------|
| Jenkinsfile | Declarative pipeline with all stages |
| Test scripts | Unit + integration test configuration |
| Pipeline execution | Screenshots, build history, metrics |
| Documentation | This guide |

---

## Implementation Checklist

### 1. Jenkins Setup

- [ ] Install Jenkins on EC2 (or dedicated build server)
- [ ] Configure required plugins (Pipeline, AWS, Docker, Git)
- [ ] Set up credentials (AWS, GitHub, ECR)
- [ ] Configure GitHub webhook for push-triggered builds

### 2. Pipeline Stages

- [ ] Checkout
- [ ] Install Dependencies (backend + frontend)
- [ ] Run Tests (Unit + Integration)
- [ ] Security Scanning (OWASP ZAP, Trivy)
- [ ] Build Docker Images
- [ ] Push to ECR
- [ ] Deploy to Staging (Automatic)
- [ ] Manual Approval Gate
- [ ] Deploy to Production
- [ ] Post-Deployment Tests
- [ ] Notifications (Slack/Email)

### 3. Testing Integration

- [ ] Unit tests (Jest/Vitest)
- [ ] Integration tests (API endpoints)
- [ ] ESLint (code quality)
- [ ] Test coverage reports

### 4. Deployment Automation

- [ ] Blue-Green or Rolling deployment strategy
- [ ] Automated rollback on failure
- [ ] Health check verification post-deploy

---

## Jenkins Setup

### Installation Options

| Option | Pros | Cons |
|--------|------|------|
| **EC2 (new instance)** | Isolated, dedicated | Extra cost |
| **Same EC2 as app** | Single server | Resource contention |
| **Docker** | Portable, easy to reset | Requires Docker on host |

### Recommended: Jenkins on EC2

```bash
# SSH to your EC2 or new build server
sudo yum update -y
sudo yum install java-11-amazon-corretto -y

# Add Jenkins repo (Amazon Linux 2)
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
sudo yum install jenkins -y
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
# Access http://<EC2_IP>:8080
```

### Required Plugins

| Plugin | Purpose |
|--------|---------|
| Pipeline | Declarative pipeline (Jenkinsfile) |
| Git | Checkout from GitHub |
| Credentials | Store secrets |
| **Optional:** Docker Pipeline, AWS Credentials Binding | Only if using Docker agent or AWS binding |

> **Note:** The implemented pipeline uses `agent any`, inline Node.js install, and curl for Slack. Docker Pipeline and AWS Credentials Binding are **not** required.

### Credentials to Configure

| ID | Type | Purpose |
|----|------|---------|
| `aws-credentials` | Username/Password | ECR push (username=Access Key, password=Secret Key) |
| `slack-webhook` | Secret text | Slack notifications (webhook URL) |
| `ec2-ssh-key` | SSH | Deploy via Ansible (if using SSH from Jenkins) |

**Adding Slack webhook:** Run the script in `scripts/add-slack-webhook-credential.groovy` in Jenkins Script Console (replace `YOUR_WEBHOOK_URL` with your Slack webhook).

### GitHub Webhook

1. GitHub repo → Settings → Webhooks → Add webhook
2. Payload URL: `http://<JENKINS_IP>:8080/github-webhook/`
3. Content type: `application/json`
4. Events: Push events (or "Just the push event")
5. Save

---

## Pipeline Stages

### Jenkinsfile Structure (Declarative)

```groovy
pipeline {
    agent any
    environment {
        AWS_REGION = 'eu-north-1'
        ECR_REGISTRY = credentials('ecr-registry-url')
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        sh 'cd backend && npm ci'
                    }
                }
                stage('Frontend') {
                    steps {
                        sh 'cd frontend && npm ci'
                    }
                }
            }
        }
        stage('Run Tests') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'cd backend && npm test'
                        sh 'cd frontend && npm test'
                    }
                }
                stage('Lint') {
                    steps {
                        sh 'cd backend && npm run lint'
                        sh 'cd frontend && npm run lint'
                    }
                }
            }
        }
        stage('Security Scan') {
            steps {
                sh 'trivy image --exit-code 0 --severity HIGH,CRITICAL backend/Dockerfile || true'
            }
        }
        stage('Build Docker Images') {
            steps {
                sh 'docker build -t afrimart/backend:$BUILD_NUMBER ./backend'
                sh 'docker build -t afrimart/frontend:$BUILD_NUMBER ./frontend'
            }
        }
        stage('Push to ECR') {
            steps {
                sh '''
                  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
                  docker tag afrimart/backend:$BUILD_NUMBER $ECR_REGISTRY/afrimart/backend:$BUILD_NUMBER
                  docker push $ECR_REGISTRY/afrimart/backend:$BUILD_NUMBER
                '''
            }
        }
        stage('Deploy to Staging') {
            steps {
                sh 'ansible-playbook -i inventory/static.yml playbooks/deploy-with-local-db.yml -e target=staging'
            }
        }
        stage('Manual Approval') {
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
            }
        }
        stage('Deploy to Production') {
            steps {
                sh 'ansible-playbook -i inventory/static.yml playbooks/deploy-with-local-db.yml -e target=production'
            }
        }
        stage('Post-Deployment Tests') {
            steps {
                sh 'curl -f http://<STAGING_URL>/health || exit 1'
            }
        }
    }
    post {
        success {
            // Slack/Email notification
        }
        failure {
            // Notify on failure
        }
    }
}
```

### Stage Details

| Stage | Purpose |
|-------|---------|
| Checkout | Clone repo from GitHub |
| Install Dependencies | `npm ci` for backend + frontend |
| Run Tests | Unit tests, lint (ESLint) |
| Security Scan | Trivy for Docker images; OWASP optional |
| Build Docker Images | `docker build` for backend, frontend |
| Push to ECR | Tag and push to AWS ECR |
| Deploy to Staging | Ansible deploy (automatic) |
| Manual Approval | Human gate before production |
| Deploy to Production | Ansible deploy |
| Post-Deployment | Health check, smoke tests |

---

## Testing Integration

### Unit Tests

**Backend (Jest):**
```json
// backend/package.json
"scripts": {
  "test": "jest --coverage"
}
```

**Frontend (Vitest):**
```json
// frontend/package.json
"scripts": {
  "test": "vitest run --coverage"
}
```

### Integration Tests

- Use Supertest (backend) for API endpoint tests
- Add `npm run test:integration` script
- Run against a test database (docker-compose or in-memory)

### Code Quality

```bash
# ESLint
cd backend && npm run lint
cd frontend && npm run lint
```

### Coverage Reports

- Configure Jest/Vitest to output `coverage/`
- Archive in Jenkins: `publishHTML target: [allowMissing: true, reportDir: 'coverage', reportFiles: 'index.html']`
- Or use Jenkins Cobertura/JaCoCo plugins

---

## Deployment Automation

### Rolling vs Blue-Green

| Strategy | Pros | Cons |
|----------|------|------|
| **Rolling** | Simpler, fewer resources | Brief mixed-version state |
| **Blue-Green** | Instant rollback, zero downtime | 2x resources during deploy |

### Ansible for Deploy

- Reuse `playbooks/deploy-with-local-db.yml`
- Use `-e target=staging` or `-e target=production` for environment-specific vars
- Add `group_vars/staging/` and `group_vars/production/` if needed

### Rollback

- Keep previous Docker image tag (e.g. `$BUILD_NUMBER - 1`)
- On failure: re-run Ansible with previous tag, or use `pm2 reload` with previous code

### Health Check Verification

```bash
curl -f http://<APP_URL>/api/health || exit 1
```

---

## Evaluation Criteria

| Criterion | Weight | How to Address |
|-----------|--------|----------------|
| **Pipeline completeness** | 30% | All stages implemented: checkout → tests → scan → build → push → deploy → notify |
| **Testing coverage** | 25% | Unit + integration tests, coverage reports, ESLint |
| **Security integration** | 25% | Trivy scan, OWASP (optional), no secrets in code |
| **Documentation** | 20% | This doc, Jenkinsfile comments, README update |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not triggering | Check Jenkins URL, firewall (8080), GitHub webhook payload |
| ECR push fails | Verify `aws-credentials` (Username/Password), Docker + AWS CLI on agent |
| Tests fail in pipeline | Run locally first; ensure `npm test` works in CI env |
| Ansible deploy fails | Ensure Jenkins has SSH key, inventory has correct hosts |
| Manual approval blocks | Click **Deploy** on the build page when prompted |
| Docker not found | Install Docker on Jenkins agent; mount `/var/run/docker.sock` if Jenkins in Docker |
| Slack not working | Add `slack-webhook` credential (Secret text); run script in Script Console |
| AmazonWebServicesCredentialsBinding not found | Use Username/Password credential instead; see JENKINS_PIPELINE_GUIDE.md |

---

## Alternative: GitHub Actions

If Jenkins is not required, GitHub Actions can be used:

- Workflows in `.github/workflows/`
- Triggers: push, pull_request
- Jobs: test → build → push to ECR → deploy (optional)
- No separate server to maintain

---

## Related Documentation

- [DEVOPS_GUIDE.md](DEVOPS_GUIDE.md) – Terraform + Ansible
- [DOCKER_PHASE3.md](DOCKER_PHASE3.md) – Docker, ECR
