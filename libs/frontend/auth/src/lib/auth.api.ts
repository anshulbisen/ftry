/**
 * Auth API exports
 * Re-exports the API client and auth-specific endpoints
 *
 * Note: User, Role, and Permission APIs should be moved to their respective
 * feature libraries for better separation of concerns.
 * TODO: Create @ftry/frontend/user-management and @ftry/frontend/rbac libraries
 */

export { apiClient } from './api-client';
export { authApi } from './api/auth-api';

// Temporary exports - should be moved to separate feature libraries
export { userApi, roleApi, permissionApi } from './api/user-management.api';
