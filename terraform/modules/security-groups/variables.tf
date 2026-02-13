variable "project" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "ssh_allowed_cidr" {
  type        = string
  description = "CIDR block allowed to SSH (use your IP, e.g. 0.0.0.0/0 for testing)"
  default     = "0.0.0.0/0"
}

variable "name_suffix" {
  type    = string
  default = ""
}
