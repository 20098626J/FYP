resource "aws_instance" "backend" {
  ami           = data.aws_ami.al2023.id
  instance_type = var.ec2_instance_type

  subnet_id                   = element(data.aws_subnets.default.ids, 0)
  vpc_security_group_ids      = [aws_security_group.ec2.id]
  associate_public_ip_address = true
  key_name                    = var.ssh_key_name != "" ? var.ssh_key_name : null

  # Install the Node.js runtime, git and pm2. The application itself is deployed
  # separately (see terraform/README.md) so infrastructure and code stay
  # decoupled — this just provisions a ready-to-run host.
  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail
    curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
    dnf install -y nodejs git
    npm install -g pm2
  EOF

  tags = {
    Name    = "${var.project}-backend"
    Project = var.project
  }
}
