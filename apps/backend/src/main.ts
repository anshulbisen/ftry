/**
 * Main entry point for the ftry backend application.
 *
 * IMPORTANT: OpenTelemetry tracing must be initialized BEFORE any other imports
 * to ensure auto-instrumentation works correctly. This file uses dynamic imports
 * to control the module loading order.
 */

import { initTracing } from '@ftry/backend/monitoring';

// Initialize OpenTelemetry tracing FIRST
// This must happen before importing any other application code
initTracing();

// Now dynamically import and run the bootstrap function
// This ensures tracing is initialized before modules are loaded
import('./bootstrap').then(({ bootstrap }) => {
  bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
});
