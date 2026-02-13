variable "project" {
  type = string
}

variable "ami_id" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "app_sg_id" {
  type = string
}

variable "instance_profile_name" {
  type = string
}

variable "user_data" {
  type    = string
  default = ""
}

variable "public_subnet_id" {
  type = string
}

variable "key_name" {
  type = string
}

variable "name_suffix" {
  type    = string
  default = ""
}
