output "launch_template_id" {
  value = aws_launch_template.this.id
}

output "instance_id" {
  value = aws_instance.app.id
}
