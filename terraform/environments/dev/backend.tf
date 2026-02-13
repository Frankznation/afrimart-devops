terraform {
  # Local backend - no S3/network required.
  # To use S3 remote state: change to backend "s3" { ... } and run terraform init -migrate-state
  backend "local" {
    path = "terraform.tfstate"
  }
}
