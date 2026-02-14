#!/bin/bash
# Fix AfriMart backend secret with RDS and Redis endpoints
set -e

# Endpoints from AWS
RDS_ENDPOINT="afrimart-postgres.c3eg66ci2w58.eu-north-1.rds.amazonaws.com"
REDIS_ENDPOINT="afrimart-redis.zqkdwh.0001.eun1.cache.amazonaws.com"

echo "RDS endpoint: $RDS_ENDPOINT"
echo "Redis endpoint: $REDIS_ENDPOINT"
echo ""
echo "Enter the database password (the one you used for Terraform db_password):"
read -sp "Password: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
  echo "Error: Password cannot be empty"
  exit 1
fi

DATABASE_URL="postgresql://afrimatadmin:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/afrimart"
REDIS_URL="redis://${REDIS_ENDPOINT}:6379"

echo "Updating secret..."
kubectl create secret generic afrimart-secrets -n afrimart \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=REDIS_URL="$REDIS_URL" \
  --from-literal=JWT_SECRET="afrimart-jwt-secret-change-in-prod" \
  --from-literal=FRONTEND_URL="http://localhost:3001" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Restarting backend..."
kubectl rollout restart deployment/backend -n afrimart

# Create exporter-credentials for postgres/redis exporters
DATA_SOURCE_NAME="postgresql://afrimatadmin:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/afrimart?sslmode=disable"
REDIS_ADDR="${REDIS_ENDPOINT}:6379"
kubectl create secret generic exporter-credentials -n monitoring \
  --from-literal=DATA_SOURCE_NAME="$DATA_SOURCE_NAME" \
  --from-literal=REDIS_ADDR="$REDIS_ADDR" \
  --dry-run=client -o yaml | kubectl apply -f - 2>/dev/null || true

echo ""
echo "Done! Wait 1-2 minutes for the backend pod to start, then check:"
echo "  kubectl get pods -n afrimart -l app=backend"
echo ""
echo "When the pod is Running, Prometheus will scrape metrics and"
echo "http_requests_total{job=\"afrimart-backend\"} will show data."
echo ""
echo "Deploy DB/Redis exporters: kubectl apply -f k8s/monitoring/postgres-exporter-deployment.yaml -f k8s/monitoring/redis-exporter-deployment.yaml"
