#!/usr/bin/env bun
/**
 * Kill processes running on specified ports
 * Used before starting dev servers to ensure ports are free
 */

import { $ } from 'bun';

const PORTS = [3000, 3001];

async function killPort(port: number): Promise<void> {
  try {
    // Find process ID using lsof
    const result = await $`lsof -ti:${port}`.quiet().nothrow();

    const pid = result.stdout.toString().trim();

    if (!pid) {
      console.log(`✓ Port ${port} is free`);
      return;
    }

    // Kill the process
    await $`kill -9 ${pid}`.quiet().nothrow();
    console.log(`✓ Killed process ${pid} on port ${port}`);
  } catch (error) {
    // Port is likely already free
    console.log(`✓ Port ${port} is free`);
  }
}

async function main() {
  console.log('🧹 Cleaning up ports...');

  for (const port of PORTS) {
    await killPort(port);
  }

  console.log('✅ All ports are ready\n');
}

main().catch((error) => {
  console.error('❌ Error killing ports:', error);
  process.exit(1);
});
