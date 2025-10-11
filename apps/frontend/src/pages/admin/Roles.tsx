/**
 * Roles Page
 *
 * Admin page for role management using ResourceManager pattern.
 * Replaces the legacy RoleManagement component with a simple
 * configuration-driven approach.
 *
 * Features:
 * - Complete CRUD operations for roles
 * - Permission-based access control
 * - System vs tenant role distinction
 * - User count and permission count tracking
 */

import { ResourceManager } from '@/components/admin/common/ResourceManager';
import { roleConfig } from '@/config/admin';

export function Roles() {
  return <ResourceManager config={roleConfig} />;
}
