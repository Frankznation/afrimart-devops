terraform {
  backend "s3" {
    bucket         = "afrimart-terraform-state-frank-2026"
    key            = "dev/terraform.tfstate"
    region         = "eu-north-1"
    dynamodb_table = "afrimart-terraform-locks"
    encrypt        = true
  }
}
