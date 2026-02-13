output "bucket_name" {
  value       = aws_s3_bucket.state.id
  description = "S3 bucket for Terraform state"
}

output "dynamodb_table" {
  value       = aws_dynamodb_table.lock.name
  description = "DynamoDB table for state locking"
}

output "backend_config" {
  value = <<-EOT
    Add to your environment's terraform block:
    
    backend "s3" {
      bucket         = "${aws_s3_bucket.state.id}"
      key            = "dev/terraform.tfstate"
      region         = "${var.aws_region}"
      dynamodb_table = "${aws_dynamodb_table.lock.name}"
      encrypt        = true
    }
  EOT
  description = "Backend configuration snippet"
}
