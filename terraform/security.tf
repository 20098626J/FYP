# Backend (EC2) security group: API reachable from CloudFront only, optional SSH.
resource "aws_security_group" "ec2" {
  name_prefix = "${var.project}-ec2-"
  description = "Broadband Ireland backend"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "API from CloudFront edge only"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  dynamic "ingress" {
    for_each = var.ssh_ingress_cidr != "" ? [1] : []
    content {
      description = "SSH"
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = [var.ssh_ingress_cidr]
    }
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Project = var.project }

  lifecycle {
    create_before_destroy = true
  }
}

# Database (RDS) security group: Postgres from the backend, plus any extra CIDRs.
resource "aws_security_group" "rds" {
  name_prefix = "${var.project}-rds-"
  description = "Broadband Ireland Postgres"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Postgres from backend"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  dynamic "ingress" {
    for_each = length(var.db_extra_ingress_cidrs) > 0 ? [1] : []
    content {
      description = "Postgres from extra CIDRs (dev / CI)"
      from_port   = 5432
      to_port     = 5432
      protocol    = "tcp"
      cidr_blocks = var.db_extra_ingress_cidrs
    }
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Project = var.project }

  lifecycle {
    create_before_destroy = true
  }
}
