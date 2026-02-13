# IAM Users for AWS Account Setup
# DevOps user with permissions for Terraform/infrastructure management

resource "aws_iam_user" "devops" {
  name = "${var.project_name}${var.name_suffix}-devops"
  path = "/"

  tags = {
    Name    = "${var.project_name}-devops"
    Purpose = "Terraform and infrastructure management"
  }
}

resource "aws_iam_user_policy_attachment" "devops" {
  user       = aws_iam_user.devops.name
  policy_arn = var.devops_policy_arn
}

resource "aws_iam_user" "cicd" {
  count  = var.create_cicd_user ? 1 : 0
  name   = "${var.project_name}${var.name_suffix}-cicd"
  path   = "/"

  tags = {
    Name    = "${var.project_name}-cicd"
    Purpose = "CI/CD pipeline (Jenkins, GitHub Actions)"
  }
}

resource "aws_iam_user_policy_attachment" "cicd" {
  count      = var.create_cicd_user ? 1 : 0
  user       = aws_iam_user.cicd[0].name
  policy_arn = var.cicd_policy_arn
}
