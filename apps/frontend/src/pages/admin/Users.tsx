/**
 * Users Page
 *
 * Admin page for user management using ResourceManager component.
 * All CRUD operations, permissions, and UI are configured in users.config.tsx.
 *
 * @see apps/frontend/src/config/admin/users.config.tsx - Complete configuration
 * @see apps/frontend/src/components/admin/common/ResourceManager.tsx - Base component
 */

import { ResourceManager } from '@/components/admin/common/ResourceManager';
import { userConfig } from '@/config/admin';

export function Users() {
  return <ResourceManager config={userConfig} />;
}
