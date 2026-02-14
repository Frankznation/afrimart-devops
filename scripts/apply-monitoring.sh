#!/bin/bash
# Apply AfriMart monitoring stack (Prometheus, Grafana, Alertmanager)
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONITORING_DIR="${SCRIPT_DIR}/../k8s/monitoring"

echo "Applying monitoring manifests from ${MONITORING_DIR}..."

kubectl apply -f "${MONITORING_DIR}/namespace.yaml"
kubectl apply -f "${MONITORING_DIR}/prometheus-rbac.yaml"
kubectl apply -f "${MONITORING_DIR}/prometheus-configmap.yaml"
kubectl apply -f "${MONITORING_DIR}/prometheus-rules.yaml"
kubectl apply -f "${MONITORING_DIR}/prometheus-deployment.yaml"

# Alertmanager: use config with webhook if exists, else example
if [ -f "${MONITORING_DIR}/alertmanager-configmap.yaml" ]; then
  kubectl apply -f "${MONITORING_DIR}/alertmanager-configmap.yaml"
else
  kubectl apply -f "${MONITORING_DIR}/alertmanager-configmap.example.yaml"
  echo "  Note: Copy alertmanager-configmap.example.yaml to alertmanager-configmap.yaml and add Slack webhook for alerts"
fi
kubectl apply -f "${MONITORING_DIR}/alertmanager-deployment.yaml"
kubectl apply -f "${MONITORING_DIR}/grafana-configmap.yaml"
kubectl apply -f "${MONITORING_DIR}/grafana-dashboards-configmap.yaml"
kubectl apply -f "${MONITORING_DIR}/grafana-dashboards.yaml"
kubectl apply -f "${MONITORING_DIR}/grafana-deployment.yaml"

# Exporters (require exporter-credentials secret - run fix-backend-now.sh or setup-exporters-secret.sh first)
kubectl apply -f "${MONITORING_DIR}/postgres-exporter-deployment.yaml" 2>/dev/null || true
kubectl apply -f "${MONITORING_DIR}/redis-exporter-deployment.yaml" 2>/dev/null || true

echo "Monitoring stack applied. Access:"
echo "  Grafana:  kubectl port-forward svc/grafana 3000:3000 -n monitoring  (admin/admin)"
echo "  Prometheus: kubectl port-forward svc/prometheus 9090:9090 -n monitoring"
