variable "project_name" {
  type = string
}

variable "environment" {
  type        = string
  default     = ""
  description = "Environment for subnet group (e.g. 'dev' => afrimart-db-subnet-group-dev)"
}

variable "identifier_suffix" {
  type        = string
  default     = ""
  description = "Suffix for RDS identifier (e.g. '-staging' => afrimart-staging-postgres)"
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "db_name" {
  type    = string
  default = "afrimart"
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_sg_id" {
  type = string
}

variable "multi_az" {
  type        = bool
  default     = false
  description = "Enable Multi-AZ for RDS (production)"
}

variable "instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "skip_final_snapshot" {
  type    = bool
  default = true
}
