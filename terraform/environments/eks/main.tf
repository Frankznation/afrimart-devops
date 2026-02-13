# AfriMart EKS Environment
# Deploys EKS cluster with RDS, Redis, S3, ECR
# Use this for Kubernetes deployment (Phase 5)

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# Core infrastructure (shared with dev)
module "vpc" {
  source           = "../../modules/vpc"
  project_name     = var.project_name
  vpc_cidr         = var.vpc_cidr
  eks_cluster_name = "${var.project_name}-eks"
}

module "security_groups" {
  source           = "../../modules/security-groups"
  project          = var.project_name
  vpc_id           = module.vpc.vpc_id
  ssh_allowed_cidr = var.ssh_allowed_cidr
}

module "rds" {
  source             = "../../modules/rds"
  project_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_username        = "afrimatadmin"
  db_password        = var.db_password
  db_sg_id           = module.security_groups.db_sg_id
}

module "redis" {
  source             = "../../modules/redis"
  project_name       = var.project_name
  private_subnet_ids = module.vpc.private_subnet_ids
  redis_sg_id        = module.security_groups.redis_sg_id
}

module "s3" {
  source       = "../../modules/s3"
  project_name = var.project_name
}

module "ecr" {
  source       = "../../modules/ecr"
  project_name = var.project_name
}

# EKS cluster
module "eks" {
  source = "../../modules/eks"

  cluster_name    = "${var.project_name}-eks"
  aws_region      = var.aws_region
  vpc_id          = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids

  on_demand_instance_types = var.on_demand_instance_types
  on_demand_desired_size   = var.on_demand_desired_size
  on_demand_min_size       = var.on_demand_min_size
  on_demand_max_size       = var.on_demand_max_size

  spot_instance_types = var.spot_instance_types
  spot_desired_size   = var.spot_desired_size
  spot_min_size       = var.spot_min_size
  spot_max_size       = var.spot_max_size

  tags = {
    Project = var.project_name
    Env     = "eks"
  }
}

# Allow EKS nodes to reach RDS and Redis
resource "aws_security_group_rule" "rds_from_eks" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = module.eks.node_security_group_id
  security_group_id        = module.security_groups.db_sg_id
  description              = "RDS from EKS nodes"
}

resource "aws_security_group_rule" "redis_from_eks" {
  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = module.eks.node_security_group_id
  security_group_id        = module.security_groups.redis_sg_id
  description              = "Redis from EKS nodes"
}
