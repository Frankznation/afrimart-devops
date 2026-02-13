resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-db-subnet-group${var.environment != "" ? "-${var.environment}" : ""}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-db-subnet-group"
  }
}

resource "aws_db_instance" "this" {
  identifier              = "${var.project_name}${var.identifier_suffix}-postgres"
  engine                  = "postgres"
  engine_version          = "15"
  instance_class          = var.instance_class
  allocated_storage       = var.allocated_storage
  multi_az                = var.multi_az
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [var.db_sg_id]
  skip_final_snapshot     = var.skip_final_snapshot
  publicly_accessible     = false

  tags = {
    Name = "${var.project_name}-postgres"
  }

  lifecycle {
    ignore_changes = [db_name, engine_version]
  }
}
