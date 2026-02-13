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

3. **Build Now**

---

## No Plugins Required

The pipeline does **not** need:
- NodeJS plugin
- Docker Pipeline plugin

Node.js is installed inline. Docker stages are skipped if Docker is unavailable.
