variable "project_name" {
  type        = string
  description = "Project name for ECR repository naming"
}

variable "name_suffix" {
  type    = string
  default = ""
}
