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

variable "ami_id" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "ssh_allowed_cidr" {
  type        = string
  description = "CIDR allowed for SSH (0.0.0.0/0 = anywhere; use YOUR_IP/32 for security)"
  default     = "0.0.0.0/0"
}
