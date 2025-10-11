# Grafana Cloud Migration

**Date**: 2025-10-08
**Status**: ✅ Complete
**Impact**: Lightweight local development, cloud-hosted monitoring

## Migration Overview

Migrated from local Docker-based LGTM stack to Grafana Cloud for improved stability and developer experience.

### Before (Heavy Local Stack)

```
docker-compose.yml:
  ├── postgres       (200MB RAM)
  ├── redis          (50MB RAM)
  ├── prometheus     (256MB RAM)
  ├── loki           (512MB RAM)
  ├── tempo          (512MB RAM)
  └── grafana        (256MB RAM)

Total Docker RAM: ~1.8 GB
Result: Docker crashes on resource-constrained machines
```

### After (Lightweight + Cloud)

```
docker-compose.yml:
  ├── postgres       (200MB RAM)
  └── redis          (50MB RAM)

Monitoring: Grafana Cloud (hosted)
Total Docker RAM: ~250 MB
Result: Stable, fast, reliable
```

## Benefits

### 1. Stability

- ✅ No more Docker Desktop crashes
- ✅ Lightweight local development
- ✅ Fast startup times

### 2. Multi-Developer Support

- ✅ Each developer has isolated telemetry via `DEVELOPER_NAME`
- ✅ Service names: `ftry-backend-anshul`, `ftry-backend-john`
- ✅ No data interference between developers

### 3. Better Monitoring

- ✅ Professional hosted Grafana dashboards
- ✅ No local resource consumption
- ✅ Access from anywhere: https://anshulbisen.grafana.net/

### 4. Scalability

- ✅ Grafana Cloud handles all monitoring load
- ✅ Your machine only runs core services (Postgres, Redis)
- ✅ Production-ready monitoring setup

## Files Modified

### Core Configuration

1. **`docker-compose.yml`**
   - Removed: prometheus, loki, tempo, grafana services
   - Removed: monitoring profiles
   - Kept: postgres, redis, pgadmin

2. **`libs/backend/monitoring/src/lib/tracing.ts`**
   - Added Grafana Cloud authentication
   - Added multi-developer isolation via service names
   - Added environment-specific configuration
   - Improved logging and diagnostics

3. **`package.json`**
   - Removed: `monitoring:start`, `monitoring:stop`, `monitoring:reset`
   - Updated: `env` script (no more `--profile all`)
   - Added: `env:admin` for pgAdmin

### Documentation

4. **`.env.example`**
   - Added Grafana Cloud configuration section
   - Added developer identification
   - Consolidated all settings

## Quick Start

### Step 1: Configure Environment

Follow [Grafana Cloud Setup](../operations/grafana-cloud-setup) to get credentials.

Add to `.env`:

```bash
DEVELOPER_NAME=your-name
GRAFANA_CLOUD_ENABLED=true
GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-XX-XX.grafana.net
GRAFANA_CLOUD_INSTANCE_ID=123456
GRAFANA_CLOUD_API_TOKEN=glc_xxxxxxxxxxxxxxxxxxxxx
```

### Step 2: Start Development

```bash
# Start lightweight Docker services
docker compose up -d

# Start dev servers (monitoring auto-configured)
bun run dev
```

### Step 3: Verify in Grafana Cloud

1. Go to https://anshulbisen.grafana.net/
2. Click **Explore** → **Tempo**
3. Search: `service_name = "ftry-backend-your-name"`
4. Traces appear! 🎉

## Configuration

### Environment Variables

| Variable                      | Required | Example                  |
| ----------------------------- | -------- | ------------------------ |
| `DEVELOPER_NAME`              | Yes      | `anshul`                 |
| `GRAFANA_CLOUD_ENABLED`       | Yes      | `true`                   |
| `GRAFANA_CLOUD_OTLP_ENDPOINT` | Yes      | `https://...grafana.net` |
| `GRAFANA_CLOUD_INSTANCE_ID`   | Maybe    | `123456`                 |
| `GRAFANA_CLOUD_API_TOKEN`     | Yes      | `glc_xxx...`             |
| `ENABLE_MONITORING`           | No       | `false` (to disable)     |

### Service Naming

| Developer  | Service Name          | Environment Label    |
| ---------- | --------------------- | -------------------- |
| anshul     | `ftry-backend-anshul` | `development-anshul` |
| john       | `ftry-backend-john`   | `development-john`   |
| (none)     | `ftry-backend`        | `development`        |
| Production | `ftry-backend`        | `production`         |

## Multi-Developer Workflow

### Scenario: 3 Developers Sharing Grafana Cloud

**Developer 1 (Anshul)**:

```bash
DEVELOPER_NAME=anshul
GRAFANA_CLOUD_API_TOKEN=glc_token_1
```

Traces: `ftry-backend-anshul`

**Developer 2 (John)**:

```bash
DEVELOPER_NAME=john
GRAFANA_CLOUD_API_TOKEN=glc_shared_token  # Can share token
```

Traces: `ftry-backend-john`

**Developer 3 (Sarah - No Telemetry)**:

```bash
GRAFANA_CLOUD_ENABLED=false
```

No cloud traces sent.

### Filtering in Grafana

```
# Your traces only
service_name = "ftry-backend-anshul"

# All developers
service_name =~ "ftry-backend-.*"

# Specific environment
deployment.environment = "development-anshul"
```

## Troubleshooting

### No Traces Appearing

Check backend logs for:

```
✅ OpenTelemetry tracing initialized
   Service: ftry-backend-anshul
   Target: 📡 Grafana Cloud
```

If you see `🏠 Local Tempo` instead:

- Verify `GRAFANA_CLOUD_ENABLED=true`
- Check API token is set

### Authentication Errors

**401 Unauthorized**:

- Verify API token is correct (starts with `glc_`)
- Check token permissions (needs Traces:Write)
- Ensure token hasn't expired

**403 Forbidden**:

- Check Instance ID is correct
- Verify token permissions

### Connection Timeouts

- Check network connectivity: `curl -v https://your-endpoint.grafana.net`
- Verify firewall/VPN settings

## Cost Considerations

### Grafana Cloud Free Tier

- **Traces**: 50 GB/month
- **Metrics**: 10k series
- **Logs**: 50 GB/month
- **Retention**: 14 days

### Typical Usage

Local development with 1-3 developers: ~1-5 GB traces/month per developer.
**Well within free tier limits.**

## Rollback Plan

If needed, restore local monitoring:

```bash
# 1. Restore docker-compose.yml from Git
git checkout HEAD~5 -- docker-compose.yml

# 2. Disable Grafana Cloud
GRAFANA_CLOUD_ENABLED=false

# 3. Start local stack
docker compose --profile monitoring up -d

# 4. Update OTLP endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Production Deployment

Use separate credentials for production:

```bash
# Production .env
GRAFANA_CLOUD_ENABLED=true
GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-XX-XX.grafana.net
GRAFANA_CLOUD_INSTANCE_ID=123456
GRAFANA_CLOUD_API_TOKEN=glc_production_token

# No DEVELOPER_NAME in production
# Service will be: ftry-backend (not ftry-backend-XXX)
```

## Next Steps

1. ✅ Remove old monitoring Docker volumes:

   ```bash
   docker volume rm ftry_prometheus_data ftry_loki_data ftry_tempo_data
   ```

2. 📊 Set up Grafana dashboards for your services
3. 🚨 Configure alerting rules in Grafana Cloud
4. 📈 Monitor trace volume and optimize if needed

## See Also

- [Grafana Cloud Setup](../operations/grafana-cloud-setup) - Configuration guide
- [Cloud Migration Summary](./cloud-migration-summary) - Overall migration
- [Grafana Cloud Documentation](https://grafana.com/docs/grafana-cloud/)

---

**Last Updated**: 2025-10-11
**Status**: Production-ready
