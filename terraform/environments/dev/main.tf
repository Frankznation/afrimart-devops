# Workspace: default=dev, staging, prod. Use: terraform workspace select <name>
locals {
  environment = terraform.workspace == "default" ? "dev" : terraform.workspace
  name_suffix = terraform.workspace == "default" ? "" : "-${terraform.workspace}"
}

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
  name_suffix  = local.name_suffix
}

module "security_groups" {
  source            = "../../modules/security-groups"
  project           = var.project_name
  vpc_id            = module.vpc.vpc_id
  ssh_allowed_cidr  = var.ssh_allowed_cidr
  name_suffix       = local.name_suffix
}

module "rds" {
  source             = "../../modules/rds"
  project_name       = var.project_name
  environment        = local.environment
  identifier_suffix  = local.name_suffix
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  db_username        = "afrimatadmin"
  db_password        = var.db_password
  db_sg_id           = module.security_groups.db_sg_id
  multi_az           = var.rds_multi_az
  instance_class     = var.rds_instance_class
}

module "redis" {
  source             = "../../modules/redis"
  project_name       = var.project_name
  name_suffix        = local.name_suffix
  private_subnet_ids = module.vpc.private_subnet_ids
  redis_sg_id        = module.security_groups.redis_sg_id
}

module "s3" {
  source       = "../../modules/s3"
  project_name = var.project_name
  name_suffix  = local.name_suffix
}

module "ecr" {
  source       = "../../modules/ecr"
  project_name = var.project_name
  name_suffix  = local.name_suffix
}

module "iam" {
  source             = "../../modules/iam"
  project_name       = var.project_name
  s3_bucket_suffix   = local.name_suffix
}

module "iam_users" {
  source           = "../../modules/iam-users"
  project_name     = var.project_name
  name_suffix      = local.name_suffix
  create_cicd_user = var.create_cicd_user
}

module "ec2" {
  source = "../../modules/ec2"

  project               = var.project_name
  name_suffix           = local.name_suffix
  ami_id                = data.aws_ami.amazon_linux.id
  instance_type         = var.instance_type
  app_sg_id             = module.security_groups.app_sg_id
  instance_profile_name = module.iam.instance_profile_name
  public_subnet_id      = module.vpc.public_subnet_ids[0]
  key_name              = "afrimarts-key"
}

# ALB - set enable_alb = true when account supports load balancers
module "alb" {
  count  = var.enable_alb ? 1 : 0
  source = "../../modules/alb"

  project            = var.project_name
  name_suffix        = local.name_suffix
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  alb_sg_id          = module.security_groups.alb_sg_id
  target_instance_id = module.ec2.instance_id
}
