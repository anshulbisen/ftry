# Grafana Cloud Setup Guide

**Goal**: Send telemetry data from local development to Grafana Cloud
**URL**: https://anshulbisen.grafana.net/

---

## Step 1: Get Grafana Cloud Configuration

### A. Access Your Grafana Cloud Portal

1. Go to https://grafana.com/auth/sign-in
2. Sign in with your account
3. You should see your stack: **anshulbisen** (https://anshulbisen.grafana.net/)

### B. Get OpenTelemetry Endpoints

1. In Grafana Cloud portal, go to **"My Account"** or **"Stacks"**
2. Click on your stack: **anshulbisen**
3. Look for **"Details"** or **"Settings"**
4. Find the **OpenTelemetry** section

You need three endpoints:

#### 1. **Tempo (Traces) Endpoint**

- Look for: "Tempo" or "Traces" endpoint
- Format: `https://tempo-prod-XX-prod-XX-XX.grafana.net/otlp`
- Or: `https://otlp-gateway-prod-XX-XX.grafana.net/otlp`

#### 2. **Prometheus (Metrics) Endpoint** (Optional for now)

- Look for: "Prometheus" or "Metrics" endpoint
- Format: `https://prometheus-prod-XX-XX.grafana.net/api/prom/push`

#### 3. **Loki (Logs) Endpoint** (Optional for now)

- Look for: "Loki" or "Logs" endpoint
- Format: `https://logs-prod-XX.grafana.net/loki/api/v1/push`

### C. Generate API Token

1. In Grafana Cloud portal, go to **"Security"** → **"Access Policies"** or **"API Keys"**
2. Click **"Create Access Policy"** or **"Generate API Key"**
3. Settings:
   - **Name**: `ftry-local-dev-telemetry`
   - **Permissions**:
     - ✅ Traces: Write
     - ✅ Metrics: Write (optional)
     - ✅ Logs: Write (optional)
   - **Expiration**: 1 year
4. Click **"Create"** and **COPY THE TOKEN** immediately (you won't see it again!)

### D. Get Instance/User ID

For Grafana Cloud authentication, you need:

- **Instance ID** (or **User ID**): Usually a number like `123456`
- **Zone**: Usually visible in the endpoint URLs (e.g., `prod-us-east-0`)

Look for these in:

- Stack details page
- Endpoint URLs (often included in the hostname)
- Organization settings

---

## Step 2: What You'll Provide

After gathering the above, you'll need to provide:

```bash
# OpenTelemetry Traces Endpoint
OTEL_EXPORTER_OTLP_ENDPOINT=https://tempo-prod-XX-XX.grafana.net

# Grafana Cloud Authentication
GRAFANA_CLOUD_INSTANCE_ID=123456
GRAFANA_CLOUD_API_TOKEN=glc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Your developer identifier (for multi-dev isolation)
DEVELOPER_NAME=anshul  # Your name or initials
```

---

## Step 3: Finding Your Configuration (Screenshots Alternative)

If you're having trouble finding the configuration:

### Option A: OpenTelemetry Integration Page

1. Go to https://anshulbisen.grafana.net/
2. Click **"Connections"** → **"Add new connection"**
3. Search for **"OpenTelemetry"**
4. Click **"OpenTelemetry Protocol (OTLP)"**
5. You should see:
   - Endpoint URLs
   - Authentication instructions
   - Example code

### Option B: Stack Management

1. Go to https://grafana.com/orgs/anshulbisen
2. Click **"Stacks"** → **anshulbisen**
3. Click **"Details"** or **"Send Data"**
4. Look for **"OTLP"** or **"OpenTelemetry"** section

### Option C: Tempo Data Source

1. Go to https://anshulbisen.grafana.net/
2. Click **"Connections"** → **"Data sources"**
3. Find **"Tempo"** data source
4. Look at the URL - it contains your instance information

---

## Expected Configuration Format

Once you gather the info, your `.env.local` will look like:

```bash
# Grafana Cloud Configuration
GRAFANA_CLOUD_ENABLED=true
GRAFANA_CLOUD_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net
GRAFANA_CLOUD_INSTANCE_ID=123456
GRAFANA_CLOUD_API_TOKEN=glc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GRAFANA_CLOUD_ZONE=prod-us-east-0

# Developer Identification (for multi-dev isolation)
DEVELOPER_NAME=anshul

# Service name will be: ftry-backend-anshul (dev) or ftry-backend (production)
```

---

## Multi-Developer Isolation Strategy

To prevent developers from interfering with each other's telemetry:

### Approach 1: Service Name Prefix (Recommended)

Each developer's telemetry will have a unique service name:

- **Anshul's local**: `ftry-backend-anshul`, `ftry-frontend-anshul`
- **Other dev**: `ftry-backend-john`, `ftry-frontend-john`
- **Production**: `ftry-backend`, `ftry-frontend`

In Grafana dashboards, you can:

- Filter by service name to see only your data
- See all developers' data when debugging
- Production data is separate

### Approach 2: Environment Labels (Alternative)

Add environment label to all traces:

- `environment=dev-anshul`
- `environment=dev-john`
- `environment=production`

We'll implement **both** for maximum flexibility.

---

## Verification

After setup, you can verify in Grafana Cloud:

1. Go to https://anshulbisen.grafana.net/
2. Click **"Explore"** → Select **"Tempo"** data source
3. Search for traces with your service name: `ftry-backend-anshul`
4. You should see traces from your local machine!

---

## Troubleshooting

### Can't Find OpenTelemetry Settings

Try these URLs directly:

- Stack details: `https://grafana.com/orgs/anshulbisen/stacks`
- Connections: `https://anshulbisen.grafana.net/connections`
- Data sources: `https://anshulbisen.grafana.net/datasources`

### No Traces Appearing

Check:

1. `GRAFANA_CLOUD_ENABLED=true` in `.env.local`
2. API token has "Traces: Write" permission
3. Backend logs show: "📡 OpenTelemetry configured for Grafana Cloud"
4. Network connectivity: `curl https://your-otlp-endpoint.grafana.net`

### Authentication Errors

- Verify API token is correct (starts with `glc_`)
- Check token hasn't expired
- Ensure token has correct permissions

---

## Next Steps

Once you provide the configuration, I'll:

1. ✅ Remove heavy monitoring stack from `docker-compose.yml`
2. ✅ Update OpenTelemetry config to send to Grafana Cloud
3. ✅ Add multi-developer isolation via service names
4. ✅ Update environment variables
5. ✅ Test connection to Grafana Cloud

---

## Questions to Answer

Please provide:

1. **OpenTelemetry endpoint** (the main OTLP endpoint for traces)
2. **Instance ID** (if required for auth)
3. **API Token** (the token you generated)
4. **Your preferred developer identifier** (e.g., "anshul", "ab", "anshul-macbook")

**Note**: You can provide the API token in a secure way (DM, encrypted, or I can help you set it up in `.env.local` which is gitignored)
