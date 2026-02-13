data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

module "vpc" {
  source       = "../../modules/vpc"
  project_name = var.project_name
  vpc_cidr     = var.vpc_cidr
}

module "security_groups" {
  source            = "../../modules/security-groups"
  project           = var.project_name
  vpc_id            = module.vpc.vpc_id
  ssh_allowed_cidr  = var.ssh_allowed_cidr
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

module "iam" {
  source       = "../../modules/iam"
  project_name = var.project_name
}

module "ec2" {
  source = "../../modules/ec2"

  project                = var.project_name
  ami_id                 = data.aws_ami.amazon_linux.id
  instance_type          = var.instance_type
  app_sg_id              = module.security_groups.app_sg_id
  instance_profile_name  = module.iam.instance_profile_name
  public_subnet_id       = module.vpc.public_subnet_ids[0]
  key_name               = "afrimarts-key"
}

// ALB module is defined but disabled here because this AWS account
// does not currently support creating load balancers (OperationNotPermitted).
// To enable later, add a module block for "../../modules/alb" and apply.
