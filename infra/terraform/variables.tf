variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-south1"
}

variable "environment" {
  description = "Environment (staging/production)"
  type        = string
  default     = "production"
}

variable "billing_account_id" {
  description = "GCP Billing Account ID"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "db_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-custom-2-7680"
}

variable "web_min_instances" {
  description = "Minimum Cloud Run instances for web"
  type        = number
  default     = 1
}

variable "web_max_instances" {
  description = "Maximum Cloud Run instances for web"
  type        = number
  default     = 10
}

variable "worker_min_instances" {
  description = "Minimum Cloud Run instances for worker"
  type        = number
  default     = 0
}

variable "worker_max_instances" {
  description = "Maximum Cloud Run instances for worker"
  type        = number
  default     = 5
}

variable "enable_ha" {
  description = "Enable high availability (regional)"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 30
}

variable "pitr_days" {
  description = "Point-in-time recovery retention in days"
  type        = number
  default     = 7
}