# Infrastructure as Code (Terraform)

## Overview

This directory contains Terraform configuration for provisioning the School ERP infrastructure on Google Cloud Platform (GCP).

## Resources Provisioned

### Compute
- **Cloud Run (Web)**: Auto-scaling web service with health checks
- **Cloud Run (Worker)**: Background job processor
- **VPC Access Connector**: Private networking for Cloud SQL access

### Database
- **Cloud SQL (PostgreSQL 16)**: Managed PostgreSQL with:
  - Automated daily backups (30-day retention)
  - Point-in-time recovery (7 days)
  - Private IP access via VPC
  - Query insights enabled
  - Auto-resize storage

### Networking
- **VPC Network**: Custom VPC with private subnets
- **VPC Access Connector**: Serverless VPC access for Cloud Run

### Security
- **Secret Manager**: Database URL and auth secrets
- **IAM**: Dedicated service account with least-privilege roles
- **Private database access** (no public IP)

### Monitoring
- **Uptime checks**: External availability monitoring
- **Budget alerts**: Cost monitoring with thresholds at 50%, 90%, 100%

### Container Registry
- **Artifact Registry**: Docker image repository

## Usage

### Prerequisites
1. GCP project created
2. Terraform installed (>= 1.5.0)
3. GCP credentials configured (`gcloud auth application-default login`)
4. Billing account linked to project

### Initialize
```bash
cd infra/terraform
terraform init
```

### Plan (Staging)
```bash
terraform plan -var-file=environments/staging.tfvars
```

### Apply (Staging)
```bash
terraform apply -var-file=environments/staging.tfvars
```

### Plan (Production)
```bash
terraform plan -var-file=environments/production.tfvars
```

### Apply (Production)
```bash
terraform apply -var-file=environments/production.tfvars
```

### Destroy
```bash
terraform destroy -var-file=environments/staging.tfvars
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `project_id` | GCP Project ID | Yes |
| `region` | GCP Region (default: asia-south1) | No |
| `environment` | Environment name | No |
| `billing_account_id` | GCP Billing Account ID | Yes |
| `db_password` | Database password | Yes |

## Security Notes

- Database has no public IP (private VPC only)
- Secrets stored in Secret Manager
- Service account follows least-privilege principle
- Deletion protection enabled in production
- All resources tagged with environment labels

## Cost Estimate

| Resource | Monthly Cost (USD) |
|----------|-------------------|
| Cloud SQL (db-custom-2-7680) | ~$150 |
| Cloud Run (Web, 1-10 instances) | ~$50-200 |
| Cloud Run (Worker, 0-5 instances) | ~$20-80 |
| Artifact Registry | ~$5 |
| Secret Manager | ~$1 |
| Cloud Monitoring | ~$10 |
| **Total** | **~$236-446** |