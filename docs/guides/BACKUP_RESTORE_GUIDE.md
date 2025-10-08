# Database Backup & Restore Guide

Comprehensive guide for database backup and disaster recovery for the ftry Salon SaaS application.

## Table of Contents

- [Overview](#overview)
- [Backup Strategy](#backup-strategy)
- [Local Backups](#local-backups)
- [Automated Cloud Backups](#automated-cloud-backups)
- [Restore Procedures](#restore-procedures)
- [Production Setup](#production-setup)
- [Testing & Verification](#testing--verification)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Why Backup?

- **Data Loss Prevention**: Hardware failures, software bugs, human errors
- **Compliance**: Data retention requirements
- **Disaster Recovery**: Recover from catastrophic failures
- **Testing**: Restore to staging for testing
- **Rollback**: Revert bad migrations or data changes

### Backup Types

1. **Daily Automated Backups**: Full database dump every day at 2 AM
2. **Pre-Migration Backups**: Automatic before schema changes
3. **Manual Backups**: On-demand for critical operations
4. **Point-in-Time Recovery (PITR)**: Continuous WAL archiving (production only)

---

## Backup Strategy

### Retention Policy

| Backup Type   | Retention | Storage Location        |
| ------------- | --------- | ----------------------- |
| Daily         | 30 days   | Local + S3 Standard-IA  |
| Weekly        | 90 days   | S3 Glacier              |
| Monthly       | 1 year    | S3 Glacier Deep Archive |
| Pre-Migration | 7 days    | Local                   |

### Backup Schedule

```
Daily:    2:00 AM UTC (7:30 AM IST)
Weekly:   Sunday 3:00 AM UTC
Monthly:  1st of month 4:00 AM UTC
```

### Backup Size Estimates

| Records | Users   | Backup Size | Time (pg_dump) | Time (restore) |
| ------- | ------- | ----------- | -------------- | -------------- |
| 10K     | 100     | ~5 MB       | ~10s           | ~30s           |
| 100K    | 1,000   | ~50 MB      | ~1m            | ~3m            |
| 1M      | 10,000  | ~500 MB     | ~10m           | ~30m           |
| 10M     | 100,000 | ~5 GB       | ~1h            | ~3h            |

---

## Local Backups

### Manual Backup

```bash
# Run backup script
./scripts/backup-database.sh

# Output:
# ✅ Backup created: backups/ftry_backup_20250108_143025.dump (12.3MB)
# ✅ Verification passed
# ✅ Old backups cleaned (retention: 30 days)
```

### What the Script Does

1. Connects to PostgreSQL database
2. Creates `pg_dump` with custom format (compressed)
3. Verifies backup integrity with `pg_restore --list`
4. Deletes backups older than 30 days
5. Logs success/failure

### Backup Location

```
/Users/anshulbisen/projects/personal/ftry/backups/
  ftry_backup_20250108_020000.dump
  ftry_backup_20250107_020000.dump
  ...
```

### Backup Format

- **Format**: PostgreSQL custom format (`.dump`)
- **Compression**: Level 9 (maximum)
- **Contents**: Schema + data + indexes + constraints

---

## Automated Cloud Backups

### GitHub Actions (Included)

Automated daily backups via GitHub Actions workflow.

**Features**:

- Runs daily at 2 AM UTC
- Uploads to AWS S3
- Sends Slack notifications
- Cleans up old backups (30-day retention)

**Setup**:

1. Add GitHub Secrets (Settings → Secrets and variables → Actions):

   ```
   DATABASE_URL=postgresql://user:password@host:5432/ftry
   POSTGRES_HOST=your-db-host.amazonaws.com
   POSTGRES_PORT=5432
   POSTGRES_USER=ftry
   POSTGRES_PASSWORD=your-secure-password
   POSTGRES_DB=ftry
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   S3_BACKUP_BUCKET=ftry-backups
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

2. Create S3 bucket:

   ```bash
   aws s3 mb s3://ftry-backups --region us-east-1
   aws s3api put-bucket-versioning \
     --bucket ftry-backups \
     --versioning-configuration Status=Enabled
   ```

3. Enable workflow:
   - Workflow file: `.github/workflows/backup-database.yml`
   - Manual trigger: Actions → Database Backup → Run workflow

### AWS RDS Automated Backups (Production)

For production databases hosted on AWS RDS:

```hcl
# Terraform configuration
resource "aws_db_instance" "ftry_production" {
  identifier = "ftry-prod"

  # Automated backups
  backup_retention_period = 30
  backup_window          = "02:00-03:00"  # 2-3 AM UTC
  maintenance_window     = "sun:03:00-sun:04:00"

  # Point-in-time recovery
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Snapshots
  final_snapshot_identifier = "ftry-prod-final-snapshot"
  skip_final_snapshot      = false

  # Encryption
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds_encryption.arn
}

# Snapshot lifecycle
resource "aws_backup_plan" "ftry_backup" {
  name = "ftry-backup-plan"

  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.ftry_vault.name
    schedule          = "cron(0 2 * * ? *)"  # 2 AM daily

    lifecycle {
      delete_after = 30
    }
  }

  rule {
    rule_name         = "weekly_backups"
    target_vault_name = aws_backup_vault.ftry_vault.name
    schedule          = "cron(0 3 ? * SUN *)"  # 3 AM Sunday

    lifecycle {
      cold_storage_after = 30
      delete_after       = 90
    }
  }
}
```

### Azure Database for PostgreSQL

```bash
# Configure automated backups
az postgres server update \
  --resource-group ftry-prod \
  --name ftry-prod-db \
  --backup-retention 30 \
  --geo-redundant-backup Enabled
```

### Google Cloud SQL

```bash
# Configure automated backups
gcloud sql instances patch ftry-prod \
  --backup-start-time=02:00 \
  --retained-backups-count=30 \
  --retained-transaction-log-days=7
```

---

## Restore Procedures

### Restore from Local Backup

```bash
# 1. List available backups
ls -lh backups/

# 2. Run restore script
./scripts/restore-database.sh backups/ftry_backup_20250108_020000.dump

# 3. Confirm restore (type 'yes')
# ⚠️  ALL CURRENT DATA WILL BE LOST!

# 4. Wait for restore to complete
# ✅ Database restored successfully

# 5. Run migrations (if schema changed)
bun prisma migrate deploy

# 6. Verify application
bun run serve
```

### What the Restore Script Does

1. **Safety Backup**: Creates backup of current database before restore
2. **Verification**: Validates backup file integrity
3. **Drop & Recreate**: Drops existing database and creates new empty one
4. **Restore**: Restores schema and data from backup
5. **Verification**: Checks restored database is accessible

### Restore from S3 (Production)

```bash
# 1. Download backup from S3
aws s3 ls s3://ftry-backups/daily/  # List backups
aws s3 cp s3://ftry-backups/daily/ftry_backup_20250108_020000.dump ./

# 2. Restore using local script
./scripts/restore-database.sh ftry_backup_20250108_020000.dump
```

### Point-in-Time Recovery (AWS RDS)

```bash
# Restore to specific timestamp
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier ftry-prod \
  --target-db-instance-identifier ftry-prod-restore-20250108 \
  --restore-time 2025-01-08T14:30:00Z

# After verification, promote restored instance
aws rds modify-db-instance \
  --db-instance-identifier ftry-prod-restore-20250108 \
  --apply-immediately
```

---

## Production Setup

### 1. AWS RDS with Automated Backups

**Recommended for production**

Benefits:

- ✅ Automated daily backups (30-day retention)
- ✅ Point-in-time recovery (5-minute granularity)
- ✅ Multi-AZ for high availability
- ✅ Encrypted backups at rest
- ✅ Cross-region replication

Setup:

```bash
# Create RDS instance with backups enabled
aws rds create-db-instance \
  --db-instance-identifier ftry-prod \
  --db-instance-class db.t4g.medium \
  --engine postgres \
  --engine-version 18.2 \
  --master-username ftry \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --backup-retention-period 30 \
  --backup-window "02:00-03:00" \
  --multi-az \
  --storage-encrypted \
  --publicly-accessible false
```

### 2. Monitoring Backup Health

Add to monitoring stack (Prometheus + Grafana):

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'backup_metrics'
    static_configs:
      - targets: ['backup-monitor:9090']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

# Alert rules
groups:
  - name: backup_alerts
    rules:
      - alert: BackupFailed
        expr: backup_last_success_timestamp < (time() - 86400) # 24h
        for: 1h
        annotations:
          summary: 'Database backup failed'
          description: 'No successful backup in last 24 hours'

      - alert: BackupTooLarge
        expr: backup_size_bytes > 10737418240 # 10GB
        annotations:
          summary: 'Backup size exceeded threshold'

      - alert: RestoreTestFailed
        expr: backup_restore_test_success == 0
        annotations:
          summary: 'Monthly restore test failed'
```

### 3. Disaster Recovery Testing

**Test restore monthly**:

```bash
# Create test database
createdb ftry_restore_test

# Restore latest backup
POSTGRES_DB=ftry_restore_test ./scripts/restore-database.sh \
  backups/ftry_backup_latest.dump

# Run integrity checks
psql ftry_restore_test -c "SELECT COUNT(*) FROM \"User\";"
psql ftry_restore_test -c "SELECT COUNT(*) FROM \"Tenant\";"

# Cleanup
dropdb ftry_restore_test
```

Schedule in cron:

```cron
0 4 1 * * /path/to/ftry/scripts/test-restore.sh >> /var/log/ftry-restore-test.log 2>&1
```

---

## Testing & Verification

### Verify Backup Integrity

```bash
# Check backup can be listed (no corruption)
PGPASSWORD=ftry pg_restore --list backups/ftry_backup_20250108_020000.dump

# Check backup size
du -h backups/ftry_backup_20250108_020000.dump

# Compare with database size
psql ftry -c "SELECT pg_size_pretty(pg_database_size('ftry'));"
```

### Test Restore to Staging

```bash
# 1. Restore production backup to staging
export POSTGRES_DB=ftry_staging
./scripts/restore-database.sh backups/prod_backup_20250108.dump

# 2. Run migrations
bun prisma migrate deploy

# 3. Seed test data
bun prisma db seed

# 4. Test application
bun run serve
```

---

## Troubleshooting

### Backup Fails: "pg_dump: connection failed"

**Issue**: Cannot connect to database

**Solution**:

```bash
# Check database is running
docker ps | grep postgres

# Check connection
psql postgresql://ftry:ftry@localhost:5432/ftry -c "SELECT 1;"

# Check .env file has correct credentials
cat .env | grep POSTGRES
```

### Backup Fails: "Disk full"

**Issue**: Not enough disk space for backup

**Solution**:

```bash
# Check disk space
df -h

# Clean old backups manually
rm backups/ftry_backup_202412*.dump

# Reduce retention period (edit scripts/backup-database.sh)
RETENTION_DAYS=7  # Change from 30 to 7
```

### Restore Fails: "role does not exist"

**Issue**: User/role mismatch between backup and target database

**Solution**:

```bash
# Restore without owner information
pg_restore --no-owner --no-acl -d ftry backups/backup.dump
```

### Restore is Very Slow

**Issue**: Large database taking hours to restore

**Solution**:

```bash
# Use parallel restore (4 jobs)
pg_restore --jobs=4 -d ftry backups/backup.dump

# Disable triggers during restore
pg_restore --disable-triggers -d ftry backups/backup.dump
```

### GitHub Actions Backup Fails

**Issue**: Workflow runs but backup fails

**Solution**:

1. Check GitHub Secrets are set correctly
2. Check S3 bucket exists and has correct permissions
3. Check database is accessible from GitHub Actions runners (firewall/VPN)
4. Check workflow logs for specific error messages

---

## Best Practices

✅ **DO**:

- Test restores monthly
- Monitor backup size trends (data growth)
- Store backups in different geographic regions
- Encrypt backups at rest and in transit
- Document restore procedures
- Set up alerting for backup failures
- Version control backup scripts

❌ **DON'T**:

- Rely on a single backup location
- Skip backup verification
- Store backups on same server as database
- Commit database credentials to git
- Ignore backup failure alerts
- Use production database for testing

---

## Emergency Contacts

| Role             | Contact           | Responsibility            |
| ---------------- | ----------------- | ------------------------- |
| Database Admin   | [Your Email]      | Backup/restore operations |
| DevOps Lead      | [Team Email]      | Infrastructure issues     |
| AWS Support      | [AWS Support URL] | RDS issues                |
| On-Call Engineer | [PagerDuty/Phone] | After-hours emergencies   |

---

## Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [AWS RDS Backup Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html)
- [Disaster Recovery Planning](https://www.postgresql.org/docs/current/backup-dump.html)
