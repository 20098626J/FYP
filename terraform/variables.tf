variable "aws_region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "eu-west-1" # Ireland
}

variable "project" {
  description = "Name prefix / tag applied to all resources."
  type        = string
  default     = "broadband-ireland"
}

variable "app_port" {
  description = "Port the Express backend listens on."
  type        = number
  default     = 3001
}

# --- Database ---

variable "db_name" {
  description = "Initial Postgres database name."
  type        = string
  default     = "broadband"
}

variable "db_username" {
  description = "Postgres master username."
  type        = string
  default     = "app"
}

variable "db_password" {
  description = "Postgres master password (required; set via tfvars or TF_VAR_db_password)."
  type        = string
  sensitive   = true
}

variable "db_engine_version" {
  description = "Postgres major version."
  type        = string
  default     = "16"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS storage in GB."
  type        = number
  default     = 20
}

variable "db_public_access" {
  description = "Whether RDS is publicly accessible (needed for GitHub Actions ingestion or local dev to reach it)."
  type        = bool
  default     = true
}

variable "db_extra_ingress_cidrs" {
  description = "Extra CIDRs allowed to reach Postgres (e.g. your IP as x.x.x.x/32, or 0.0.0.0/0 to let GitHub-hosted runners connect)."
  type        = list(string)
  default     = []
}

# --- Compute ---

variable "ec2_instance_type" {
  description = "EC2 instance type for the backend."
  type        = string
  default     = "t3.micro"
}

variable "ssh_key_name" {
  description = "Name of an existing EC2 key pair for SSH access (empty = no SSH key attached)."
  type        = string
  default     = ""
}

variable "ssh_ingress_cidr" {
  description = "CIDR allowed to SSH to the backend (e.g. your IP as x.x.x.x/32). Empty disables SSH ingress."
  type        = string
  default     = ""
}
