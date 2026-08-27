output "cloudfront_domain" {
  description = "Public HTTPS domain for the app; use as the frontend VITE_API_URL."
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "Distribution id (for cache invalidations after a frontend deploy)."
  value       = aws_cloudfront_distribution.main.id
}

output "frontend_bucket" {
  description = "S3 bucket to sync the built frontend into."
  value       = aws_s3_bucket.frontend.bucket
}

output "backend_public_dns" {
  description = "EC2 public DNS (SSH / app deploy target)."
  value       = aws_instance.backend.public_dns
}

output "backend_public_ip" {
  value = aws_instance.backend.public_ip
}

output "rds_endpoint" {
  description = "RDS Postgres host."
  value       = aws_db_instance.main.address
}

output "database_url" {
  description = "Connection string for the backend .env and the GitHub Actions DATABASE_URL secret."
  value       = "postgres://${var.db_username}:${var.db_password}@${aws_db_instance.main.address}:5432/${var.db_name}"
  sensitive   = true
}
