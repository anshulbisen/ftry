# Database Backup & Restore

Comprehensive backup strategy and disaster recovery for ftry.

**Last Updated**: 2025-10-11

## Quick Start

```bash
# Manual backup
./scripts/backup-database.sh

# Restore from backup
./scripts/restore-database.sh backups/ftry_backup_20250111_020000.dump
```

## Backup Strategy

### Backup Types

1. **Daily Automated**: Full dump every day at 2 AM
2. **Pre-Migration**: Automatic before schema changes
3. **Manual**: On-demand for critical operations
4. **Point-in-Time Recovery (PITR)**: Production only (AWS RDS)

### Retention Policy

| Type    | Retention | Storage             |
| ------- | --------- | ------------------- |
| Daily   | 30 days   | Local + S3 Standard |
| Weekly  | 90 days   | S3 Glacier          |
| Monthly | 1 year    | S3 Glacier Deep     |

| Pre-Migr...

| 7 days | Local |

### Schedule

```
Daily:   2:00 AM UTC (7:30 AM IST)
Weekly:  Sunday 3:00 AM UTC
Monthly: 1st of month 4:00 AM UTC
```

## Local Backups

### Manual Backup

```bash
./scripts/backup-database.sh

# Output:
# ✅ Backup created: backups/ftry_backup_20250111_143025.dump (12.3MB)
# ✅ Verification passed
# ✅ Old backups cleaned (retention: 30 days)
```

**What it does**:

1. Connects to PostgreSQL
2. Creates `pg_dump` (compressed, custom format)
3. Verifies integrity with `pg_restore --list`
4. Deletes backups older than 30 days
5. Logs success/failure

**Location**: `/backups/ftry_backup_YYYYMMDD_HHMMSS.dump`

**Format**:

- PostgreSQL custom format (`.dump`)
- Compression: Level 9
- Contents: Schema + data + indexes + constraints

## Restore Procedures

### Local Restore

```bash
# 1. List backups
ls -lh backups/

# 2. Run restore script
./scripts/restore-database.sh backups/ftry_backup_20250111_020000.dump

# 3. Confirm (type 'yes')
# ⚠️ ALL CURRENT DATA WILL BE LOST!

# 4. Wait for completion
# ✅ Database restored successfully

# 5. Run migrations (if schema changed)
bun prisma migrate deploy

# 6. Verify application
nx serve backend
```

**What it does**:

1. Creates safety backup of current DB
2. Validates backup file integrity
3. Drops existing database
4. Creates new empty database
5. Restores schema and data
6. Verifies restored database

### S3 Restore (Production)

```bash
# 1. Download from S3
aws s3 ls s3://ftry-backups/daily/
aws s3 cp s3://ftry-backups/daily/ftry_backup_20250111.dump ./

# 2. Restore
./scripts/restore-database.sh ftry_backup_20250111.dump
```

### Point-in-Time Recovery (AWS RDS)

```bash
# Restore to specific timestamp
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier ftry-prod \
  --target-db-instance-identifier ftry-prod-restore \
  --restore-time 2025-01-11T14:30:00Z

# After verification, promote
aws rds modify-db-instance \
  --db-instance-identifier ftry-prod-restore \
  --apply-immediately
```

## Automated Cloud Backups

### GitHub Actions

Automated daily backups via GitHub Actions.

**Setup**:

1. Add secrets (Settings → Secrets):

   ```
   DATABASE_URL
   POSTGRES_HOST
   POSTGRES_USER
   POSTGRES_PASSWORD
   POSTGRES_DB
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   S3_BACKUP_BUCKET
   SLACK_WEBHOOK_URL
   ```

2. Create S3 bucket:

   ```bash
   aws s3 mb s3://ftry-backups --region us-east-1
   aws s3api put-bucket-versioning \
     --bucket ftry-backups \
     --versioning-configuration Status=Enabled
   ```

3. Enable workflow: `.github/workflows/backup-database.yml`

### AWS RDS (Production)

```hcl
resource "aws_db_instance" "ftry_prod" {
  identifier = "ftry-prod"

  # Automated backups
  backup_retention_period = 30
  backup_window          = "02:00-03:00"

  # Point-in-time recovery
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Encryption
  storage_encrypted = true
}
```

## Production Setup

### AWS RDS

**Recommended for production**

Benefits:

- ✅ Automated daily backups (30-day retention)
- ✅ Point-in-time recovery (5-min granularity)
- ✅ Multi-AZ for high availability
- ✅ Encrypted at rest
- ✅ Cross-region replication

```bash
aws rds create-db-instance \
  --db-instance-identifier ftry-prod \
  --db-instance-class db.t4g.medium \
  --engine postgres \
  --engine-version 18.2 \
  --backup-retention-period 30 \
  --backup-window "02:00-03:00" \
  --multi-az \
  --storage-encrypted \
  --publicly-accessible false
```

### Monitoring

```yaml
# Prometheus alerts
groups:
  - name: backup_alerts
    rules:
      - alert: BackupFailed
        expr: backup_last_success < (time() - 86400)
        annotations:
          summary: 'No backup in 24 hours'

      - alert: BackupTooLarge
        expr: backup_size_bytes > 10737418240
        annotations:
          summary: 'Backup > 10GB'
```

### Monthly Restore Test

```bash
# Create test database
createdb ftry_restore_test

# Restore latest backup
POSTGRES_DB=ftry_restore_test ./scripts/restore-database.sh \
  backups/ftry_backup_latest.dump

# Verify
psql ftry_restore_test -c "SELECT COUNT(*) FROM \"User\";"

# Cleanup
dropdb ftry_restore_test
```

Schedule in cron:

```cron
0 4 1 * * /path/to/ftry/scripts/test-restore.sh >> /var/log/restore-test.log 2>&1
```

## Testing & Verification

### Verify Integrity

```bash
# Check backup can be listed
pg_restore --list backups/ftry_backup_20250111.dump

# Check size
du -h backups/ftry_backup_20250111.dump

# Compare with database
psql ftry -c "SELECT pg_size_pretty(pg_database_size('ftry'));"
```

### Test Restore to Staging

```bash
# Restore to staging
export POSTGRES_DB=ftry_staging
./scripts/restore-database.sh backups/prod_backup.dump

# Run migrations
bun prisma migrate deploy

# Seed test data
bun prisma db seed

# Test application
nx serve backend
```

## Troubleshooting

### "pg_dump: connection failed"

```bash
# Check database running
docker ps | grep postgres

# Test connection
psql postgresql://ftry:ftry@localhost:5432/ftry -c "SELECT 1;"

# Check credentials
cat .env | grep POSTGRES
```

### "Disk full"

```bash
# Check space
df -h

# Clean old backups
rm backups/ftry_backup_202412*.dump

# Reduce retention (edit backup script)
RETENTION_DAYS=7
```

### "role does not exist"

```bash
# Restore without owner info
pg_restore --no-owner --no-acl -d ftry backups/backup.dump
```

### Restore Very Slow

```bash
# Use parallel restore (4 jobs)
pg_restore --jobs=4 -d ftry backups/backup.dump

# Disable triggers during restore
pg_restore --disable-triggers -d ftry backups/backup.dump
```

## Best Practices

### ✅ DO

- Test restores monthly
- Monitor backup size trends
- Store in different geographic regions
- Encrypt at rest and in transit
- Document procedures
- Set up alerting
- Version control scripts

### ❌ DON'T

- Rely on single backup location
- Skip verification
- Store on same server as database
- Commit credentials to git
- Ignore failure alerts
- Use production for testing

## Emergency Contacts

| Role        | Contact      | Responsibility     |
| ----------- | ------------ | ------------------ |
| DB Admin    | [Your Email] | Backup/restore ops |
| DevOps      | [Team Email] | Infrastructure     |
| AWS Support | [AWS URL]    | RDS issues         |
| On-Call     | [PagerDuty]  | After-hours        |

## Related Documentation

- [Database Quick Reference](./database-quick-reference)
- [Database Architecture](../architecture/database)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html)
