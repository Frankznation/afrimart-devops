#!/bin/bash
# Apply AfriMart Kubernetes manifests
# Usage: ./scripts/k8s-apply.sh
# Prerequisites: kubectl configured, secret created

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="${SCRIPT_DIR}/../k8s"

echo "Applying AfriMart manifests..."
kubectl apply -f "${K8S_DIR}/namespace.yaml"
kubectl apply -f "${K8S_DIR}/configmap.yaml"

if [ -f "${K8S_DIR}/secret.yaml" ]; then
  kubectl apply -f "${K8S_DIR}/secret.yaml"
else
  echo "WARNING: k8s/secret.yaml not found. Create from secret.yaml.example and fill in values."
  exit 1
fi

kubectl apply -f "${K8S_DIR}/backend-deployment.yaml"
kubectl apply -f "${K8S_DIR}/backend-service.yaml"
kubectl apply -f "${K8S_DIR}/frontend-deployment.yaml"
kubectl apply -f "${K8S_DIR}/frontend-service.yaml"
kubectl apply -f "${K8S_DIR}/hpa.yaml"
kubectl apply -f "${K8S_DIR}/pdb.yaml"
kubectl apply -f "${K8S_DIR}/network-policy.yaml"
kubectl apply -f "${K8S_DIR}/ingress.yaml"

echo "Done. Check: kubectl get pods -n afrimart"
