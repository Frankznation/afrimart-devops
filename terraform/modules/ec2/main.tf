resource "aws_launch_template" "this" {
  name_prefix   = "${var.project}${var.name_suffix}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type
  key_name      = "afrimarts-key"

  vpc_security_group_ids = [var.app_sg_id]

  iam_instance_profile {
    name = var.instance_profile_name
  }

  user_data = base64encode(var.user_data)

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name    = "${var.project}${var.name_suffix}-app"
      Project = var.project
    }
  }
}

resource "aws_instance" "app" {
  launch_template {
    id      = aws_launch_template.this.id
    version = "$Latest"
  }

  subnet_id = var.public_subnet_id

  tags = {
    Name = "${var.project}${var.name_suffix}-app-ec2"
  }
}
