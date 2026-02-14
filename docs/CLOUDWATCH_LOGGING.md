# CloudWatch Logging (Option B)

Container logs from AfriMart EKS are sent to CloudWatch Logs via Fluent Bit.

## Checklist

- [x] Configure log groups (auto-created by Fluent Bit or via script)
- [x] Deploy Fluent Bit DaemonSet
- [x] Set up IAM permissions (IRSA or node role)
- [ ] Set up Log Insights queries
- [ ] Create CloudWatch dashboards

---

## 1. Deploy Fluent Bit

```bash
./scripts/setup-cloudwatch-logging.sh
```

Or manually:

```bash
# Create namespace
kubectl apply -f k8s/logging/namespace.yaml

# Create cluster-info ConfigMap
ClusterName=afrimart-eks
RegionName=eu-north-1
kubectl create configmap fluent-bit-cluster-info \
  --from-literal=cluster.name=${ClusterName} \
  --from-literal=logs.region=${RegionName} \
  --from-literal=http.server=On \
  --from-literal=http.port=2020 \
  --from-literal=read.head=Off \
  --from-literal=read.tail=On \
  -n amazon-cloudwatch --dry-run=client -o yaml | kubectl apply -f -

# Deploy Fluent Bit (from AWS)
kubectl apply -f https://raw.githubusercontent.com/aws-samples/amazon-cloudwatch-container-insights/latest/k8s-deployment-manifest-templates/deployment-mode/daemonset/container-insights-monitoring/fluent-bit/fluent-bit.yaml
```

**IAM:** The EKS node IAM role must allow `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`, `logs:DescribeLogGroups`, `logs:DescribeLogStreams`. Or use IRSA (see `setup-cloudwatch-logging.sh`).

---

## 2. Log Groups

| Log group | Contents |
|-----------|----------|
| `/aws/containerinsights/afrimart-eks/application` | Container stdout/stderr from all pods |
| `/aws/containerinsights/afrimart-eks/host` | Host logs (dmesg, secure, messages) |
| `/aws/containerinsights/afrimart-eks/dataplane` | kubelet, containerd, kube-proxy |

---

## 3. Log Insights Queries

In **CloudWatch → Logs → Logs Insights**, select the `application` log group and run:

### Backend errors
```
fields @timestamp, @message, kubernetes.pod_name, kubernetes.namespace_name
| filter kubernetes.namespace_name = "afrimart" and kubernetes.pod_name like /backend/
| filter @message like /error|Error|ERROR|exception|Exception/
| sort @timestamp desc
| limit 100
```

### 5xx responses
```
fields @timestamp, @message
| filter @message like / 5\d\d /
| sort @timestamp desc
```

### Backend request logs
```
fields @timestamp, @message
| filter kubernetes.pod_name like /backend/
| parse @message /"method":"(?<method>[^"]+)".*"url":"(?<url>[^"]+)"/
| stats count() by method, url
```

### All AfriMart app logs (last hour)
```
fields @timestamp, @message, kubernetes.pod_name
| filter kubernetes.namespace_name = "afrimart"
| sort @timestamp desc
```

---

## 4. CloudWatch Dashboards

### Create a dashboard

1. **CloudWatch Console** → **Dashboards** → **Create dashboard**
2. Add widgets, e.g.:
   - **Logs Insights** widget: run one of the queries above
   - **Metric** widget: `ContainerInsights` namespace → `pod_number_of_container_restarts` (if Container Insights metrics enabled)

### Sample dashboard JSON (Log Insights widgets)

Create a dashboard with a Log Insights widget:

1. Add widget → **Logs** → **Logs Insights**
2. Select log group: `/aws/containerinsights/afrimart-eks/application`
3. Query: `fields @timestamp, @message | filter kubernetes.namespace_name = "afrimart" | sort @timestamp desc | limit 50`

---

## 5. Cost Notes

- CloudWatch Logs: ingestion + storage (see [pricing](https://aws.amazon.com/cloudwatch/pricing/))
- Fluent Bit runs as a DaemonSet (1 pod per node)
- To reduce volume: exclude high-chatty containers in Fluent Bit config

---

## Troubleshooting

| Issue | Check |
|-------|-------|
| No log groups | `kubectl get pods -n amazon-cloudwatch`; check Fluent Bit logs |
| Permission errors | Node IAM role or IRSA must have `logs:PutLogEvents` etc. |
| Pods Pending | Cluster at capacity; Fluent Bit adds 1 pod per node |
