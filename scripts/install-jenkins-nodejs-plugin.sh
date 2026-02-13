#!/usr/bin/env bash
# Install NodeJS plugin in Jenkins via REST API
# Usage: JENKINS_URL=http://localhost:9090 [JENKINS_USER=admin JENKINS_TOKEN=xxx] ./scripts/install-jenkins-nodejs-plugin.sh

set -e
JENKINS_URL="${JENKINS_URL:-http://localhost:9090}"
AUTH=""
CURL_OPTS="-sS -w '\n%{http_code}'"

if [ -n "$JENKINS_USER" ] && [ -n "$JENKINS_TOKEN" ]; then
  AUTH="-u $JENKINS_USER:$JENKINS_TOKEN"
elif [ -n "$JENKINS_USER" ] && [ -n "$JENKINS_PASSWORD" ]; then
  AUTH="-u $JENKINS_USER:$JENKINS_PASSWORD"
fi

echo "Installing NodeJS plugin in Jenkins at $JENKINS_URL..."

# Get CSRF crumb if auth is used
CRUMB_HEADER=""
if [ -n "$AUTH" ]; then
  CRUMB=$(curl -sS $AUTH "$JENKINS_URL/crumbIssuer/api/json" 2>/dev/null | grep -o '"crumb":"[^"]*"' | cut -d'"' -f4) || true
  if [ -n "$CRUMB" ]; then
    CRUMB_HEADER="-H \"Jenkins-Crumb: $CRUMB\""
  fi
fi

# Install plugin
RESP=$(eval "curl -X POST -d '<plugin>nodejs@latest</plugin>' -H 'Content-Type: text/xml' $AUTH $CRUMB_HEADER '$JENKINS_URL/pluginManager/installNecessaryPlugins'" 2>&1) || true

# Also try without auth for first-time setup
if echo "$RESP" | grep -qE "403|401|302"; then
  echo "Auth may be required. Set JENKINS_USER and JENKINS_TOKEN (or JENKINS_PASSWORD)."
  echo "Trying without auth..."
  RESP=$(curl -sS -X POST -d '<plugin>nodejs@latest</plugin>' \
    -H 'Content-Type: text/xml' \
    "$JENKINS_URL/pluginManager/installNecessaryPlugins" 2>&1) || true
fi

echo "Request sent. Check Jenkins Update Center: $JENKINS_URL/updateCenter/"
echo "Restart Jenkins if needed. Then add NodeJS 18 in Global Tool Configuration."
