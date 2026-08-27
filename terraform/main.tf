provider "aws" {
  region = var.aws_region
}

# Use the account's default VPC and its subnets to keep the footprint minimal —
# no custom VPC, NAT gateways or route tables to manage.
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Latest Amazon Linux 2023 AMI for the backend instance.
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# AWS-managed prefix list of CloudFront's origin-facing IP ranges, so the backend
# security group can allow the API port from CloudFront only.
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}
