resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.project_name}${var.name_suffix}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids

  lifecycle {
    ignore_changes = [subnet_ids]
  }
}

resource "aws_elasticache_cluster" "this" {
  cluster_id           = "${var.project_name}${var.name_suffix}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1

  subnet_group_name    = aws_elasticache_subnet_group.this.name
  security_group_ids   = [var.redis_sg_id]

  port = 6379

  lifecycle {
    ignore_changes = [security_group_ids]
  }
}
