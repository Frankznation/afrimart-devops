#!/bin/bash
# Create exporter-credentials secret for postgres-exporter and redis-exporter
set -e

echo "Fetching RDS and Redis endpoints from AWS..."
RDS_ENDPOINT=$(aws rds describe-db-instances --query "DBInstances[?contains(DBInstanceIdentifier,'afrimart')].Endpoint.Address" --output text 2>/dev/null | head -1)
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters --show-cache-node-info --query "CacheClusters[?contains(CacheClusterId,'afrimart')].CacheNodes[0].Endpoint.Address" --output text 2>/dev/null | head -1)

if [ -z "$RDS_ENDPOINT" ] || [ -z "$REDIS_ENDPOINT" ]; then
  echo "Could not find RDS or Redis. Ensure they exist and AWS CLI is configured."
  exit 1
fi

echo "RDS: $RDS_ENDPOINT"
echo "Redis: $REDIS_ENDPOINT"
echo ""
read -sp "Enter DB password (afrimatadmin): " DB_PASSWORD
echo ""

DATA_SOURCE_NAME="postgresql://afrimatadmin:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/afrimart?sslmode=disable"
REDIS_ADDR="${REDIS_ENDPOINT}:6379"

kubectl create secret generic exporter-credentials -n monitoring \
  --from-literal=DATA_SOURCE_NAME="$DATA_SOURCE_NAME" \
  --from-literal=REDIS_ADDR="$REDIS_ADDR" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secret created. Deploy exporters:"
echo "  kubectl apply -f k8s/monitoring/postgres-exporter-deployment.yaml"
echo "  kubectl apply -f k8s/monitoring/redis-exporter-deployment.yaml"
