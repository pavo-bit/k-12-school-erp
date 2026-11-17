terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "school-erp-tfstate"
    key    = "terraform.tfstate"
    region = "ap-south-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "school-erp"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "environment" {
  type    = string
  default = "prod"
}

# VPC
module "vpc" {
  source = "./modules/vpc"
  # ...
}

# Aurora Serverless v2
module "aurora" {
  source = "./modules/aurora"
  # ...
}

# S3
module "storage" {
  source = "./modules/storage"
  # ...
}

# Lambda
module "lambda" {
  source = "./modules/lambda"
  # ...
}

# SQS
module "queues" {
  source = "./modules/queues"
  # ...
}

# CloudFront
module "cdn" {
  source = "./modules/cdn"
  # ...
}

# Secrets
module "secrets" {
  source = "./modules/secrets"
  # ...
}

# IAM
module "iam" {
  source = "./modules/iam"
  # ...
}