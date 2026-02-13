# Jenkins Setup for AfriMart Pipeline

## Required: NodeJS Plugin

The pipeline needs Node.js for `npm ci` and tests. Install the NodeJS plugin:

### 1. Install Plugin

1. **Manage Jenkins** → **Manage Plugins**
2. **Available** tab → search **NodeJS**
3. Check **NodeJS Plugin**
4. Click **Install without restart** (or **Download now and install after restart**)
5. Wait for installation to complete

### 2. Configure Node.js

1. **Manage Jenkins** → **Global Tool Configuration**
2. Scroll to **NodeJS**
3. Click **Add NodeJS**
4. **Name:** `NodeJS 18`
5. **Install automatically:** check it
6. **Version:** choose **18.x** (e.g. NodeJS 18.20.4)
7. Click **Save**

### 3. Run Pipeline

1. Go to **afrimart-pipeline**
2. Click **Build Now**

---

## Note on Docker Stages

If Jenkins runs in Docker **without** Docker-in-Docker, the **Security Scan** and **Build Docker Images** stages will be skipped (they require the `docker` command). Install Dependencies and Run Tests will work with the NodeJS plugin.
