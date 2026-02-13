variable "project_name" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "redis_sg_id" {
  type = string
}

variable "name_suffix" {
  type    = string
  default = ""
}
