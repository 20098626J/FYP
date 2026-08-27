# Infrastructure (Terraform)

Minimum AWS environment for Broadband Ireland:

| Resource | Purpose |
|----------|---------|
| RDS Postgres (`db.t4g.micro`) | Application database |
| EC2 (`t3.micro`, Amazon Linux 2023) | Express backend host (Node 22 + pm2 pre-installed) |
| S3 bucket (private) | Built React frontend |
| CloudFront | Single HTTPS domain — serves the S3 site and proxies `/api/*` to EC2 |
| Security groups | API reachable from CloudFront only; Postgres from the backend (+ optional CIDRs) |

It uses the account's **default VPC/subnets**, so there is no custom networking to manage.

## Deploy the infrastructure

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # then set db_password (and any optional vars)

terraform init
terraform plan
terraform apply
```

Key outputs:

```bash
terraform output cloudfront_domain          # frontend VITE_API_URL + the public site
terraform output frontend_bucket            # S3 bucket for the frontend build
terraform output cloudfront_distribution_id # for cache invalidation
terraform output backend_public_dns         # EC2 host
terraform output -raw database_url          # DATABASE_URL for the app + the GH Actions secret
```

## Deploy the application onto it

Infrastructure and code are decoupled — provisioning gives you a ready host; deploy the app with:

**Backend (on EC2):**
```bash
ssh ec2-user@$(terraform output -raw backend_public_dns)
git clone <your repo> app && cd app
npm ci
printf 'DATABASE_URL=%s\nPORT=3001\nENABLE_SCHEDULED_INGEST=true\n' "<database_url>" > .env
node scripts/create-ed-schema.js && node scripts/seed-electoral-divisions.js
node scripts/seed-test-plans.js         # base providers/technologies + plans
node scripts/add-plan-provenance.js
node scripts/ingest/run.js              # populate live plan data
pm2 start server.js --name broadband && pm2 save
```

**Frontend (locally, then upload):**
```bash
cd frontend
# set VITE_API_URL to the cloudfront_domain output, then:
npm ci && npm run build
aws s3 sync dist/ "s3://$(cd ../terraform && terraform output -raw frontend_bucket)/" --delete
aws cloudfront create-invalidation \
  --distribution-id "$(cd ../terraform && terraform output -raw cloudfront_distribution_id)" \
  --paths '/*'
```

## Notes

- **RDS reachability for GitHub Actions.** The nightly ingestion workflow needs to
  reach RDS. Either set `db_extra_ingress_cidrs = ["0.0.0.0/0"]` (public, password
  protected) and `db_public_access = true`, or rely on the in-process `node-cron`
  scheduler on EC2 (which reaches RDS privately) and skip opening the database.
- **State** is local by default. For team use, add an S3 backend.
- `terraform destroy` tears everything down (`skip_final_snapshot`/`force_destroy`
  are set for easy teardown — not production-safe).
