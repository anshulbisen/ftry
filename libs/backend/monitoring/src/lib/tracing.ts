import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

/**
 * Initialize OpenTelemetry Tracing
 *
 * This function sets up distributed tracing for the ftry backend using OpenTelemetry.
 * It automatically instruments:
 * - HTTP/HTTPS requests and responses
 * - Database queries (via Prisma/PostgreSQL)
 * - Redis operations
 * - DNS lookups
 * - Net operations
 *
 * Traces are exported to:
 * - Grafana Cloud (production/cloud-enabled)
 * - Local Tempo (development with local monitoring stack)
 *
 * Multi-Developer Isolation:
 * Set DEVELOPER_NAME environment variable to add your identifier to service name.
 * Example: DEVELOPER_NAME=anshul → service name becomes "ftry-backend-anshul"
 *
 * IMPORTANT: This must be called BEFORE creating the NestJS application
 * to ensure all instrumentations are properly set up.
 *
 * NOTE: Auto-instrumentation is disabled in development when using webpack
 * bundling as it cannot instrument already-loaded modules. Use manual
 * instrumentation or run without webpack for full tracing in development.
 *
 * @returns NodeSDK instance for graceful shutdown, or null if monitoring is disabled
 */
export function initTracing(): NodeSDK | null {
  // Check if monitoring is explicitly disabled
  if (process.env['ENABLE_MONITORING'] === 'false') {
    console.warn('⚠️  Monitoring disabled via ENABLE_MONITORING=false');
    return null;
  }

  // Check if Grafana Cloud is enabled
  const grafanaCloudEnabled = process.env['GRAFANA_CLOUD_ENABLED'] === 'true';
  if (grafanaCloudEnabled && !process.env['GRAFANA_CLOUD_API_TOKEN']) {
    console.warn('⚠️  Grafana Cloud enabled but GRAFANA_CLOUD_API_TOKEN not set');
    console.warn('   Please configure Grafana Cloud credentials in .env.local');
    console.warn('   See docs/GRAFANA_CLOUD_SETUP.md for instructions');
    return null;
  }

  // Disable auto-instrumentation in development/webpack builds
  // Webpack bundles all modules together, making auto-instrumentation ineffective
  const isWebpackBuild = process.env['NODE_ENV'] !== 'production';
  if (isWebpackBuild) {
    console.warn(
      '⚠️  Auto-instrumentation disabled in development (webpack build). Manual tracing only.',
    );
    // Return null to skip auto-instrumentation but keep manual tracing available
    // In production (non-webpack), auto-instrumentation will work correctly
    return null;
  }

  try {
    // Enable diagnostic logging in development
    if (process.env['NODE_ENV'] !== 'production') {
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
    }

    // Determine OTLP endpoint and authentication
    const grafanaCloudEnabled = process.env['GRAFANA_CLOUD_ENABLED'] === 'true';
    const otlpEndpoint = grafanaCloudEnabled
      ? `${process.env['GRAFANA_CLOUD_OTLP_ENDPOINT']}/v1/traces`
      : process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] || 'http://localhost:4318/v1/traces';

    // Prepare authentication headers
    const headers: Record<string, string> = {};

    if (grafanaCloudEnabled) {
      // Grafana Cloud uses Basic Auth: instanceID:apiToken encoded as base64
      const instanceId = process.env['GRAFANA_CLOUD_INSTANCE_ID'];
      const apiToken = process.env['GRAFANA_CLOUD_API_TOKEN'];

      if (instanceId && apiToken) {
        // Basic Auth format: "Basic base64(instanceId:apiToken)"
        const credentials = Buffer.from(`${instanceId}:${apiToken}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      } else if (apiToken) {
        // Some Grafana Cloud configurations use Bearer token directly
        headers['Authorization'] = `Bearer ${apiToken}`;
      }
    }

    // Configure trace exporter
    const traceExporter = new OTLPTraceExporter({
      url: otlpEndpoint,
      headers,
      timeoutMillis: 10000, // Increased for cloud connection
    });

    // Determine service name with developer isolation
    const baseServiceName = 'ftry-backend';
    const developerName = process.env['DEVELOPER_NAME'];
    const serviceName = developerName ? `${baseServiceName}-${developerName}` : baseServiceName;

    // Determine environment
    const environment = process.env['NODE_ENV'] || 'development';
    const environmentLabel = developerName ? `${environment}-${developerName}` : environment;

    // Create resource with service information
    const resource = resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: process.env['APP_VERSION'] || '1.0.0',
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environmentLabel,
      // Additional attributes for Grafana Cloud
      'developer.name': developerName || 'unknown',
      'deployment.target': grafanaCloudEnabled ? 'grafana-cloud' : 'local',
    });

    // Create and configure SDK
    const sdk = new NodeSDK({
      resource,
      spanProcessors: [
        new BatchSpanProcessor(traceExporter, {
          // Batch span configuration
          maxQueueSize: 2048,
          maxExportBatchSize: 512,
          scheduledDelayMillis: 5000,
          exportTimeoutMillis: 30000,
        }),
      ],
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable file system instrumentation (too noisy)
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          // HTTP instrumentation
          '@opentelemetry/instrumentation-http': {
            enabled: true,
            ignoreIncomingRequestHook: (request) => {
              // Don't trace health checks and metrics endpoints
              const url = request.url || '';
              return (
                url.includes('/health') || url.includes('/metrics') || url.includes('/favicon.ico')
              );
            },
            ignoreOutgoingRequestHook: (request) => {
              // Don't trace requests to monitoring services
              const hostname = request.hostname || request.host || '';
              return (
                hostname.includes('prometheus') ||
                hostname.includes('loki') ||
                hostname.includes('tempo') ||
                hostname.includes('grafana')
              );
            },
            requestHook: (span, request) => {
              // Add custom attributes to HTTP spans
              if ('httpVersion' in request) {
                span.setAttribute('http.flavor', (request as any).httpVersion);
              }
            },
            responseHook: (span, response) => {
              // Add response size if available
              if ('headers' in response) {
                const contentLength = (response as any).headers?.['content-length'];
                if (contentLength) {
                  span.setAttribute('http.response.body.size', parseInt(contentLength, 10));
                }
              }
            },
          },
          // Express instrumentation
          '@opentelemetry/instrumentation-express': {
            enabled: true,
          },
          // PostgreSQL instrumentation
          '@opentelemetry/instrumentation-pg': {
            enabled: true,
            enhancedDatabaseReporting: true,
          },
          // Redis instrumentation
          '@opentelemetry/instrumentation-ioredis': {
            enabled: true,
            dbStatementSerializer: (cmdName, cmdArgs) => {
              // Sanitize Redis commands to avoid leaking sensitive data
              return `${cmdName} ${cmdArgs.length} args`;
            },
          },
          // DNS instrumentation
          '@opentelemetry/instrumentation-dns': {
            enabled: true,
          },
          // Net instrumentation
          '@opentelemetry/instrumentation-net': {
            enabled: true,
          },
        }),
      ],
    });

    // Start the SDK
    sdk.start();

    // Graceful shutdown
    const shutdown = async () => {
      try {
        console.warn('Shutting down OpenTelemetry SDK...');
        await sdk.shutdown();
        console.warn('OpenTelemetry SDK shut down successfully');
      } catch (error) {
        console.error('Error shutting down OpenTelemetry SDK:', error);
      } finally {
        process.exit(0);
      }
    };

    // Register shutdown handlers
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    console.warn('✅ OpenTelemetry tracing initialized');
    console.warn(`   Service: ${serviceName}`);
    console.warn(`   Version: ${process.env['APP_VERSION'] || '1.0.0'}`);
    console.warn(`   Environment: ${environmentLabel}`);
    console.warn(`   Target: ${grafanaCloudEnabled ? '📡 Grafana Cloud' : '🏠 Local Tempo'}`);
    console.warn(`   Endpoint: ${otlpEndpoint}`);
    if (developerName) {
      console.warn(`   Developer: ${developerName}`);
    }

    return sdk;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('⚠️  Failed to initialize OpenTelemetry tracing:', errorMessage);
    console.warn('   Application will continue without distributed tracing');
    console.warn('   To enable monitoring, ensure Tempo is running and accessible');
    return null;
  }
}

/**
 * Get current trace context from active span
 *
 * This can be used to inject trace context into logs for correlation.
 *
 * @returns Object with trace_id and span_id, or empty object if no active span
 */
export function getTraceContext(): { trace_id?: string; span_id?: string } {
  try {
    const { trace, context } = require('@opentelemetry/api');
    const span = trace.getSpan(context.active());

    if (span) {
      const spanContext = span.spanContext();
      return {
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
      };
    }
  } catch (error) {
    // Silently fail if OpenTelemetry is not available
  }

  return {};
}
