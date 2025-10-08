# Grafana Cloud Migration Summary

**Date**: 2025-10-08
**Status**: ✅ Complete

---

## What Changed

### Before (Heavy Local Stack)

```
docker-compose.yml:
  ├── postgres
  ├── redis
  ├── prometheus (256MB RAM)
  ├── loki (512MB RAM)
  ├── tempo (512MB RAM)
  └── grafana (256MB RAM)

Total Docker RAM: ~1.5-2 GB
Result: Docker Desktop crashes on resource-constrained machines
```

### After (Lightweight + Cloud)

```
docker-compose.yml:
  ├── postgres
  └── redis

Monitoring: Grafana Cloud (hosted)

Total Docker RAM: ~200-300 MB
Result: Stable, fast, reliable
```

---

## Benefits

### 1. **Stability**

- ✅ No more Docker Desktop crashes
- ✅ Lightweight local development
- ✅ Fast startup times

### 2. **Multi-Developer Support**

- ✅ Each developer has isolated telemetry via `DEVELOPER_NAME`
- ✅ Service names: `ftry-backend-anshul`, `ftry-backend-john`
- ✅ No data interference between developers

### 3. **Better Monitoring**

- ✅ Hosted Grafana with better performance
- ✅ No local resource constraints
- ✅ Access from anywhere: https://anshulbisen.grafana.net/

### 4. **Scalability**

- ✅ Grafana Cloud handles all monitoring load
- ✅ Your machine only runs core services
- ✅ Production-ready monitoring setup

---

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

4. **`docs/GRAFANA_CLOUD_SETUP.md`** (NEW)
   - Step-by-step guide to get Grafana Cloud credentials
   - Endpoint configuration instructions
   - API token generation guide

5. **`.env.example`** (UPDATED)
   - Now includes all configuration in one place
   - Grafana Cloud settings included
   - Developer identification
   - Copy to `.env` for your personal configuration

6. **`docs/GRAFANA_CLOUD_MIGRATION.md`** (THIS FILE)
   - Migration summary
   - Benefits and changes
   - Quick start guide

### Removed Files

7. **Docker monitoring configs** (can be removed if not needed):
   - `docker/monitoring/prometheus.yml`
   - `docker/monitoring/loki-config.yaml`
   - `docker/monitoring/tempo-config.yaml`
   - `docker/monitoring/grafana/` directory

---

## Quick Start

### Step 1: Get Grafana Cloud Configuration

Follow **`docs/GRAFANA_CLOUD_SETUP.md`** to:

1. Access your Grafana Cloud instance
2. Get OTLP endpoint
3. Generate API token
4. Get instance ID

### Step 2: Configure `.env`

```bash
# Copy the example
cp .env.example .env

# Edit with your values
nano .env
```

Required values:

```bash
DEVELOPER_NAME=anshul  # Your name/identifier
GRAFANA_CLOUD_ENABLED=true
GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-XX-XX.grafana.net
GRAFANA_CLOUD_INSTANCE_ID=123456
GRAFANA_CLOUD_API_TOKEN=glc_xxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Start Development

```bash
# Start lightweight Docker services
docker compose up -d

# Start dev servers
bun run dev:simple
```

### Step 4: Verify in Grafana Cloud

1. Go to https://anshulbisen.grafana.net/
2. Click **Explore** → Select **Tempo**
3. Search for service: `ftry-backend-anshul`
4. You should see traces! 🎉

---

## Configuration Reference

### Environment Variables

| Variable                      | Required | Example                  | Description                             |
| ----------------------------- | -------- | ------------------------ | --------------------------------------- |
| `DEVELOPER_NAME`              | Yes      | `anshul`                 | Your identifier for multi-dev isolation |
| `GRAFANA_CLOUD_ENABLED`       | Yes      | `true`                   | Enable Grafana Cloud telemetry          |
| `GRAFANA_CLOUD_OTLP_ENDPOINT` | Yes      | `https://...grafana.net` | OTLP endpoint (without /v1/traces)      |
| `GRAFANA_CLOUD_INSTANCE_ID`   | Maybe    | `123456`                 | Instance ID for Basic Auth              |
| `GRAFANA_CLOUD_API_TOKEN`     | Yes      | `glc_xxx...`             | API token with Traces:Write permission  |
| `ENABLE_MONITORING`           | No       | `false`                  | Disable all monitoring                  |

### Service Naming

| Developer  | Service Name          | Environment Label    |
| ---------- | --------------------- | -------------------- |
| anshul     | `ftry-backend-anshul` | `development-anshul` |
| john       | `ftry-backend-john`   | `development-john`   |
| (none)     | `ftry-backend`        | `development`        |
| Production | `ftry-backend`        | `production`         |

---

## Development Workflow

### Standard Workflow

```bash
# 1. Start Docker services
docker compose up -d

# 2. Start dev servers (Grafana Cloud auto-configured)
bun run dev:simple

# 3. Make requests to backend
curl http://localhost:3001/health

# 4. View traces in Grafana Cloud
# Open: https://anshulbisen.grafana.net/
# Go to: Explore → Tempo
# Filter by: service_name = "ftry-backend-anshul"
```

### With pgAdmin

```bash
# Start with admin tools
docker compose --profile admin up -d
# Or use: bun run env:admin

# Access pgAdmin: http://localhost:5050
```

### Disable Monitoring Temporarily

```bash
# In .env:
ENABLE_MONITORING=false

# Or via command line:
ENABLE_MONITORING=false bun run dev:simple
```

---

## Multi-Developer Setup

### Scenario: 3 Developers Using Same Grafana Cloud

**Developer 1 (Anshul)**:

```bash
# .env
DEVELOPER_NAME=anshul
GRAFANA_CLOUD_ENABLED=true
GRAFANA_CLOUD_API_TOKEN=glc_anshul_token
```

Traces appear as: `ftry-backend-anshul`

**Developer 2 (John)**:

```bash
# .env
DEVELOPER_NAME=john
GRAFANA_CLOUD_ENABLED=true
GRAFANA_CLOUD_API_TOKEN=glc_shared_token  # Can share token
```

Traces appear as: `ftry-backend-john`

**Developer 3 (Sarah - Testing)**:

```bash
# .env
DEVELOPER_NAME=sarah-test
GRAFANA_CLOUD_ENABLED=false  # No cloud telemetry
```

No traces sent to cloud.

### Filtering in Grafana

Each developer can filter to see only their traces:

```
# In Grafana Explore → Tempo
service_name = "ftry-backend-anshul"

# Or see all developers:
service_name =~ "ftry-backend-.*"

# Or specific environment:
deployment.environment = "development-anshul"
```

---

## Troubleshooting

### No Traces Appearing in Grafana Cloud

**Check logs on backend startup**:

```
✅ OpenTelemetry tracing initialized
   Service: ftry-backend-anshul
   Version: 1.0.0
   Environment: development-anshul
   Target: 📡 Grafana Cloud
   Endpoint: https://otlp-gateway-prod-XX-XX.grafana.net/v1/traces
   Developer: anshul
```

If you see `🏠 Local Tempo` instead of `📡 Grafana Cloud`:

- Check `GRAFANA_CLOUD_ENABLED=true` in `.env`
- Verify API token is set

If you see warnings:

```
⚠️  Grafana Cloud enabled but GRAFANA_CLOUD_API_TOKEN not set
```

- Add `GRAFANA_CLOUD_API_TOKEN` to `.env`

### Authentication Errors

**401 Unauthorized**:

- Verify API token is correct
- Check token permissions (needs Traces:Write)
- Ensure token hasn't expired

**403 Forbidden**:

- Check Instance ID is correct
- Verify token has correct permissions

### Connection Timeouts

- Check network connectivity to Grafana Cloud
- Try: `curl -v https://your-endpoint.grafana.net`
- Check firewall/VPN settings

### Docker Still Crashing

If Docker still crashes after removing monitoring stack:

1. Check Docker Desktop memory settings (Settings → Resources)
2. Try restarting Docker Desktop
3. Use `bun run dev:simple` instead of `bun run dev`
4. See `docs/DOCKER_TROUBLESHOOTING.md`

---

## Cost Considerations

### Grafana Cloud Free Tier

As of 2025, Grafana Cloud Free tier includes:

- **Traces**: 50 GB per month
- **Metrics**: 10k series
- **Logs**: 50 GB per month
- **Retention**: 14 days

### Estimating Usage

For local development with 1-3 developers:

- ~1-5 GB traces per month per developer
- Well within free tier limits

### Monitoring Usage

Check your usage in Grafana Cloud:

1. Go to **Organization** → **Usage**
2. View traces sent per day
3. Set up alerts if approaching limits

---

## Rollback Plan

If you need to go back to local monitoring stack:

1. **Restore docker-compose.yml** from Git history:

   ```bash
   git checkout HEAD~5 -- docker-compose.yml
   ```

2. **Disable Grafana Cloud**:

   ```bash
   # In .env
   GRAFANA_CLOUD_ENABLED=false
   ```

3. **Start local stack**:

   ```bash
   docker compose --profile monitoring up -d
   ```

4. **Update OTLP endpoint**:
   ```bash
   # In .env
   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
   ```

---

## Production Deployment

For production, use separate Grafana Cloud credentials:

```bash
# Production .env
GRAFANA_CLOUD_ENABLED=true
GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-XX-XX.grafana.net
GRAFANA_CLOUD_INSTANCE_ID=123456
GRAFANA_CLOUD_API_TOKEN=glc_production_token_xxx

# No DEVELOPER_NAME in production
# Service will be: ftry-backend (not ftry-backend-XXX)
```

---

## Next Steps

1. ✅ Remove old monitoring Docker volumes:

   ```bash
   docker volume rm ftry_prometheus_data ftry_loki_data ftry_tempo_data ftry_grafana_data
   ```

2. ✅ Remove old monitoring scripts (optional):

   ```bash
   rm scripts/monitoring.sh
   ```

3. ✅ Clean up old monitoring configs (optional):

   ```bash
   rm -rf docker/monitoring/
   ```

4. 📊 Set up Grafana dashboards for your service
5. 🚨 Configure alerting rules in Grafana Cloud
6. 📈 Monitor trace volume and optimize if needed

---

## Support

- **Setup Help**: See `docs/GRAFANA_CLOUD_SETUP.md`
- **Docker Issues**: See `docs/DOCKER_TROUBLESHOOTING.md`
- **Project Docs**: See `CLAUDE.md`
- **Grafana Cloud Docs**: https://grafana.com/docs/grafana-cloud/

---

## Summary

✅ **Lightweight local development** - Only Postgres + Redis in Docker
✅ **Cloud-hosted monitoring** - Grafana Cloud handles all telemetry
✅ **Multi-developer isolation** - Each developer has unique service name
✅ **Stable and fast** - No more Docker Desktop crashes
✅ **Production-ready** - Same setup works for production

**Result**: Better developer experience + better monitoring!
