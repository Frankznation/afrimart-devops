resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}${var.s3_bucket_suffix}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}${var.s3_bucket_suffix}-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# S3 access for application uploads
resource "aws_iam_role_policy" "s3_access" {
  name   = "${var.project_name}${var.s3_bucket_suffix}-ec2-s3"
  role   = aws_iam_role.ec2_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-uploads${var.s3_bucket_suffix}",
          "arn:aws:s3:::${var.project_name}-uploads${var.s3_bucket_suffix}/*"
        ]
      }
    ]
  })
}

# CloudWatch Logs (optional)
resource "aws_iam_role_policy" "cloudwatch_logs" {
  name   = "${var.project_name}${var.s3_bucket_suffix}-ec2-logs"
  role   = aws_iam_role.ec2_role.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}
