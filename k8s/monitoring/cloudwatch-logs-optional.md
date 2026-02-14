# CloudWatch Logs (Optional)

To send container logs from EKS to CloudWatch Logs:

## 1. Create Log Groups

```bash
aws logs create-log-group --log-group-name /aws/eks/afrimart/application
aws logs create-log-group --log-group-name /aws/eks/afrimart/backend
aws logs create-log-group --log-group-name /aws/eks/afrimart/frontend
```

## 2. IAM Role for Fluent Bit

The Fluent Bit pod needs IAM permissions to write to CloudWatch. Use IRSA:

```bash
# Create IAM policy
aws iam create-policy \
  --policy-name FluentBitCloudWatchPolicy \
  --policy-document file://fluent-bit-policy.json

# Create service account with IRSA (use eksctl or Terraform)
eksctl create iamserviceaccount \
  --name fluent-bit \
  --namespace amazon-cloudwatch \
  --cluster afrimart-eks \
  --attach-policy-arn arn:aws:iam::ACCOUNT_ID:policy/FluentBitCloudWatchPolicy \
  --approve
```

## 3. Deploy Fluent Bit

See [AWS docs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-setup-logs.html) for the full Fluent Bit DaemonSet and ConfigMap.

## 4. CloudWatch Log Insights Queries

Example queries in Log Insights:

```
# Backend errors
fields @timestamp, @message
| filter @logStream like /backend/ and @message like /error|ERROR/
| sort @timestamp desc

# 5xx responses
fields @timestamp, @message
| filter @message like / 5\d\d /
```
