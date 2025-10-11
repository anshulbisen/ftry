/**
 * Admin Resource Configurations
 *
 * Centralized exports for all admin resource configurations.
 * Each resource config defines the complete CRUD interface for
 * that entity type using the ResourceManager component.
 *
 * @example
 * ```tsx
 * import { userConfig } from '@/config/admin';
 * import { ResourceManager } from '@/components/admin/common';
 *
 * export function UsersPage() {
 *   return <ResourceManager config={userConfig} />;
 * }
 * ```
 */

export { userConfig } from './users.config';
export { tenantConfig } from './tenants.config';
export { roleConfig } from './roles.config';
export { permissionConfig } from './permissions.config';
