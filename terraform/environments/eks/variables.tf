variable "aws_region" {
  default = "eu-north-1"
}

variable "project_name" {
  default = "afrimart"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "ssh_allowed_cidr" {
  type        = string
  default     = "0.0.0.0/0"
  description = "CIDR for SSH access"
}

variable "on_demand_instance_types" {
  type    = list(string)
  default = ["t3.medium"]
}

variable "on_demand_desired_size" {
  type    = number
  default = 2
}

variable "on_demand_min_size" {
  type    = number
  default = 1
}

variable "on_demand_max_size" {
  type    = number
  default = 4
}

variable "spot_instance_types" {
  type    = list(string)
  default = ["t3.medium", "t3a.medium"]
}

variable "spot_desired_size" {
  type    = number
  default = 1
}

variable "spot_min_size" {
  type    = number
  default = 0
}

variable "spot_max_size" {
  type    = number
  default = 4
}
