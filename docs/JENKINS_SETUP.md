# Jenkins Setup for AfriMart Pipeline

Quick reference. For full details, see **[JENKINS_PIPELINE_GUIDE.md](./JENKINS_PIPELINE_GUIDE.md)**.

---

## Quick Start

1. **Run Jenkins** (Docker example):
   ```bash
   docker run -d --name jenkins -p 9090:8080 -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts
   ```

2. **Create pipeline job**:
   - New Item → Pipeline → name: `afrimart-pipeline`
   - Pipeline from SCM → Git
   - Repo: `https://github.com/Frankznation/afrimart-devops`
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`

3. **Add credentials** (see below)

4. **Build Now**

---

## Credentials to Add

### AWS (for ECR Push)

- **Manage Jenkins** → **Credentials** → **Add**
- Kind: **Username with password**
- Username: AWS Access Key ID
- Password: AWS Secret Access Key
- ID: `aws-credentials`

### Slack (for notifications)

- **Manage Jenkins** → **Script Console**
- Paste and run script from `scripts/add-slack-webhook-credential.groovy` (replace `YOUR_WEBHOOK_URL` with your Slack webhook)
- Or add manually: Credentials → Secret text → ID: `slack-webhook`

---

## Manual Approval

When the pipeline pauses at **Manual Approval**, open the build and click **Deploy** to continue.

---

## No Plugins Required

The pipeline does **not** need:

- NodeJS plugin (Node.js installed inline)
- Docker Pipeline plugin (Docker stages skip if unavailable)
- Slack Notification plugin (uses curl + webhook credential)
