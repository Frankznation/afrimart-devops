# EKS cluster for AfriMart
# Uses official terraform-aws-modules/eks
# Subnet EKS tags are applied in VPC module via eks_cluster_name

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = var.cluster_name
  cluster_version = var.kubernetes_version

  vpc_id     = var.vpc_id
  subnet_ids = concat(var.public_subnet_ids, var.private_subnet_ids)

  cluster_endpoint_public_access  = true
  cluster_endpoint_private_access = true

  # IRSA for AWS Load Balancer Controller
  enable_irsa = true

  # On-demand node group
  eks_managed_node_groups = {
    on_demand = {
      name            = "${var.cluster_name}-on-demand"
      instance_types  = var.on_demand_instance_types
      capacity_type   = "ON_DEMAND"
      desired_size    = var.on_demand_desired_size
      min_size        = var.on_demand_min_size
      max_size        = var.on_demand_max_size
      disk_size       = 50
      subnet_ids      = var.private_subnet_ids

      labels = {
        role = "general"
      }

      tags = {
        Name = "${var.cluster_name}-on-demand"
      }
    }
    spot = {
      name            = "${var.cluster_name}-spot"
      instance_types  = var.spot_instance_types
      capacity_type   = "SPOT"
      desired_size    = var.spot_desired_size
      min_size        = var.spot_min_size
      max_size        = var.spot_max_size
      disk_size       = 50
      subnet_ids      = var.private_subnet_ids

      labels = {
        role = "spot"
      }

      taints = []

      tags = {
        Name = "${var.cluster_name}-spot"
      }
    }
  }

  # AWS Load Balancer Controller addon (or install via Helm - see docs)
  enable_cluster_creator_admin_permissions = true

  tags = var.tags
}
