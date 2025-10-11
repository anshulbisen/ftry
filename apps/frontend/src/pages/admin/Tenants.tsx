/**
 * Tenants Page
 *
 * Admin page for tenant management using ResourceManager pattern.
 * Replaces the legacy TenantManagement component with a simple
 * configuration-driven approach.
 *
 * Features:
 * - Complete CRUD operations for tenants
 * - Permission-based access control
 * - Suspend/activate actions
 * - User count tracking
 */

import { ResourceManager } from '@/components/admin/common/ResourceManager';
import { tenantConfig } from '@/config/admin';

export function Tenants() {
  return <ResourceManager config={tenantConfig} />;
}
