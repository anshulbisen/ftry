/**
 * Permissions Page
 *
 * Admin page for viewing permissions using ResourceManager pattern.
 * Permissions are read-only - they are system-defined and cannot be
 * created or modified via the UI.
 *
 * Features:
 * - View all available permissions
 * - Search by name, category, or description
 * - Filter by category and scope
 * - Permission-based access control
 */

import { ResourceManager } from '@/components/admin/common/ResourceManager';
import { permissionConfig } from '@/config/admin';

export function Permissions() {
  return <ResourceManager config={permissionConfig} />;
}
