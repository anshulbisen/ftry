# Health Check API

Monitor service health and dependencies.

## GET /api/health

Check application health status.

**Auth**: Not required

**Response (200)** - Healthy:

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    }
  }
}
```

**Response (503)** - Unhealthy:

```json
{
  "status": "error",
  "info": {
    "memory_heap": {
      "status": "up"
    }
  },
  "error": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    },
    "memory_heap": {
      "status": "up"
    }
  }
}
```

## Health Indicators

### Database

Checks PostgreSQL connectivity via Prisma.

**Healthy**: Successful query execution
**Unhealthy**: Connection timeout, query failure

### Memory Heap

Checks Node.js heap memory usage.

**Healthy**: < 90% heap used
**Unhealthy**: ≥ 90% heap used

## Usage

### Kubernetes Liveness Probe

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 30
```

### Monitoring Alerts

```bash
# Check every 60 seconds
while true; do
  status=$(curl -s http://localhost:3001/api/health | jq -r '.status')
  if [ "$status" != "ok" ]; then
    echo "ALERT: Service unhealthy"
  fi
  sleep 60
done
```

---

**Implementation**: `libs/backend/health/src/lib/health.controller.ts`
