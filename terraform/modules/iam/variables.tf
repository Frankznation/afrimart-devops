variable "project_name" {}

variable "s3_bucket_suffix" {
  type    = string
  default = ""
  description = "Suffix for S3 bucket name (must match S3 module name_suffix)"
}
