# AfriMart Documentation

Documentation index and guidelines for the AfriMart DevOps project.

---

## Documentation Index

### Infrastructure (Phase 1)
| Document | Description |
|----------|-------------|
| [TERRAFORM_PHASE1.md](TERRAFORM_PHASE1.md) | Terraform modules, VPC, RDS, Redis, S3, ECR |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture diagrams (Mermaid) |
| [COST_ESTIMATION.md](COST_ESTIMATION.md) | Cost estimation |
| [DEVOPS_GUIDE.md](DEVOPS_GUIDE.md) | Terraform + Ansible deployment guide |

### Containerization (Phase 3)
| Document | Description |
|----------|-------------|
| [DOCKER_PHASE3.md](DOCKER_PHASE3.md) | Docker, ECR, container best practices |
| [IMAGE_SIZE_REPORT.md](IMAGE_SIZE_REPORT.md) | Image size optimization report |

### CI/CD (Phase 4)
| Document | Description |
|----------|-------------|
| [CI_CD_PHASE4.md](CI_CD_PHASE4.md) | Jenkins pipeline, deployment |
| [JENKINS_PIPELINE_GUIDE.md](JENKINS_PIPELINE_GUIDE.md) | Jenkins setup & troubleshooting |
| [JENKINS_SETUP.md](JENKINS_SETUP.md) | Quick Jenkins reference |

### Kubernetes (Phase 5)
| Document | Description |
|----------|-------------|
| [KUBERNETES_PHASE5.md](KUBERNETES_PHASE5.md) | EKS, manifests, Helm, architecture |
| [RESOURCE_UTILIZATION.md](RESOURCE_UTILIZATION.md) | Node sizing, pod allocation, HPA |

### Monitoring (Phase 6)
| Document | Description |
|----------|-------------|
| [MONITORING_PHASE6.md](MONITORING_PHASE6.md) | Prometheus, Grafana, Alertmanager |
| [PROMETHEUS_MONITORING_GUIDELINE.md](PROMETHEUS_MONITORING_GUIDELINE.md) | Queries, dashboards, troubleshooting |
| [ALERTING.md](ALERTING.md) | Alert rules, notification channels |
| [CLOUDWATCH_LOGGING.md](CLOUDWATCH_LOGGING.md) | CloudWatch Logs, Fluent Bit |
| [RUNBOOK.md](RUNBOOK.md) | Alert remediation runbook |

### Security (Phase 7)
| Document | Description |
|----------|-------------|
| [SECURITY_PHASE7.md](SECURITY_PHASE7.md) | Secrets, TLS, scanning, IAM |
| [SECURITY_ASSESSMENT_REPORT.md](SECURITY_ASSESSMENT_REPORT.md) | Security assessment findings |
| [BACKUP_RESTORE.md](BACKUP_RESTORE.md) | Backup and restore procedures |
| [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) | DR plan, RTO/RPO |
| [COMPLIANCE_CHECKLIST.md](COMPLIANCE_CHECKLIST.md) | CIS, AWS compliance checklist |

---

## Guidelines

### Documentation Standards
- Use Markdown for all docs
- Include table of contents for long documents
- Link related documents
- Keep commands copy-paste ready

### Phase Quick Reference
| Phase | Focus | Key Docs |
|-------|-------|----------|
| 1 | Infrastructure | TERRAFORM_PHASE1, ARCHITECTURE |
| 3 | Containers | DOCKER_PHASE3 |
| 4 | CI/CD | CI_CD_PHASE4, JENKINS_PIPELINE_GUIDE |
| 5 | Kubernetes | KUBERNETES_PHASE5, RESOURCE_UTILIZATION |
| 6 | Monitoring | MONITORING_PHASE6, PROMETHEUS_MONITORING_GUIDELINE |
| 7 | Security | SECURITY_PHASE7, BACKUP_RESTORE, DISASTER_RECOVERY |
