#!/bin/bash
# Setup CloudWatch Logs for AfriMart EKS
# - Creates log groups
# - Configures Fluent Bit cluster-info
# - Sets up IRSA for Fluent Bit (optional; node role can also be used)
# Prerequisites: kubectl, aws CLI, eksctl (for IRSA)

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLUSTER_NAME="${CLUSTER_NAME:-afrimart-eks}"
AWS_REGION="${AWS_REGION:-eu-north-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "REPLACE_WITH_ACCOUNT_ID")

echo "=== CloudWatch Logging Setup for AfriMart ==="
echo "Cluster: $CLUSTER_NAME, Region: $AWS_REGION"
echo ""

# 1. Create log groups (optional - Fluent Bit can auto-create)
echo "1. Creating CloudWatch log groups..."
for lg in application host dataplane; do
  aws logs create-log-group --log-group-name "/aws/containerinsights/${CLUSTER_NAME}/${lg}" --region "$AWS_REGION" 2>/dev/null || true
done
echo "   Log groups: /aws/containerinsights/${CLUSTER_NAME}/{application,host,dataplane}"
echo ""

# 2. Create namespace and cluster-info ConfigMap
echo "2. Applying namespace and cluster-info ConfigMap..."
kubectl apply -f "$PROJECT_ROOT/k8s/logging/namespace.yaml"
kubectl create configmap fluent-bit-cluster-info \
  --from-literal=cluster.name="$CLUSTER_NAME" \
  --from-literal=logs.region="$AWS_REGION" \
  --from-literal=http.server="On" \
  --from-literal=http.port="2020" \
  --from-literal=read.head="Off" \
  --from-literal=read.tail="On" \
  -n amazon-cloudwatch \
  --dry-run=client -o yaml | kubectl apply -f -
echo ""

# 3. Create IAM policy for Fluent Bit (if using IRSA)
echo "3. Creating IAM policy for Fluent Bit..."
aws iam create-policy \
  --policy-name FluentBitCloudWatchPolicy \
  --policy-document file://"$PROJECT_ROOT/k8s/logging/fluent-bit-policy.json" \
  2>/dev/null || echo "   Policy may already exist, continuing..."
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/FluentBitCloudWatchPolicy"
echo "   Policy ARN: $POLICY_ARN"
echo ""

# 4. Create IRSA for Fluent Bit (optional - requires eksctl)
echo "4. Creating IRSA for fluent-bit service account..."
if command -v eksctl &>/dev/null; then
  eksctl create iamserviceaccount \
    --name fluent-bit \
    --namespace amazon-cloudwatch \
    --cluster "$CLUSTER_NAME" \
    --attach-policy-arn "$POLICY_ARN" \
    --approve \
    --region "$AWS_REGION" \
    2>/dev/null || echo "   IRSA may already exist. If Fluent Bit fails, ensure node IAM role has CloudWatch Logs permissions."
else
  echo "   eksctl not found. Add CloudWatch Logs permissions to your EKS node IAM role manually."
  echo "   Or install eksctl: https://eksctl.io/installation/"
fi
echo ""

# 5. Deploy Fluent Bit DaemonSet
echo "5. Deploying Fluent Bit DaemonSet..."
kubectl apply -f "https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/fluent-bit/fluent-bit.yaml"
echo ""

echo "=== Setup complete ==="
echo "Fluent Bit will create/use log groups:"
echo "  - /aws/containerinsights/${CLUSTER_NAME}/application  (container logs)"
echo "  - /aws/containerinsights/${CLUSTER_NAME}/host         (host logs)"
echo "  - /aws/containerinsights/${CLUSTER_NAME}/dataplane    (kubelet, etc.)"
echo ""
echo "Verify: kubectl get pods -n amazon-cloudwatch"
echo "CloudWatch: https://${AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#logsV2:log-groups"
