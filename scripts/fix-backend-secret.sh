#!/bin/bash
# Update afrimart-secrets with RDS and Redis from Terraform outputs
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${SCRIPT_DIR}/../terraform/environments/eks"

cd "$TF_DIR"

DB_ENDPOINT=$(terraform output -raw db_endpoint 2>/dev/null || echo "")
REDIS_ENDPOINT=$(terraform output -raw redis_endpoint 2>/dev/null || echo "")

if [ -z "$DB_ENDPOINT" ] || [ -z "$REDIS_ENDPOINT" ]; then
  echo "Could not get Terraform outputs. Run: cd terraform/environments/eks && terraform output"
  exit 1
fi

echo "DB endpoint: $DB_ENDPOINT"
echo "Redis endpoint: $REDIS_ENDPOINT"
echo ""
read -sp "Enter DB password (afrimatadmin): " DB_PASSWORD
echo ""

DATABASE_URL="postgresql://afrimatadmin:${DB_PASSWORD}@${DB_ENDPOINT}:5432/afrimart"
REDIS_URL="redis://${REDIS_ENDPOINT}:6379"

kubectl create secret generic afrimart-secrets -n afrimart \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=REDIS_URL="$REDIS_URL" \
  --from-literal=JWT_SECRET="afrimart-jwt-secret-change-in-prod" \
  --from-literal=FRONTEND_URL="http://localhost:3000" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secret updated. Restarting backend..."
kubectl rollout restart deployment/backend -n afrimart
