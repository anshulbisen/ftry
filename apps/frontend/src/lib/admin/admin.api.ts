import { apiClient } from '@/lib/api';
import type { SafeUser, Role, Tenant, Permission } from '@ftry/shared/types';

/**
 * Admin API Client
 *
 * Provides methods for interacting with the unified admin API.
 * All endpoints automatically scope data based on user permissions.
 */

// Base URL for admin endpoints
const ADMIN_BASE = '/admin';

// Types for admin operations - include index signature for DataTable compatibility
export interface TenantWithStats extends Tenant {
  userCount: number;
  [key: string]: unknown;
}

export interface RoleWithStats extends Role {
  userCount: number;
  permissionCount: number;
  [key: string]: unknown;
}

// Type alias for user list items - includes all SafeUser properties
// Add index signature for DataTable compatibility
export type UserListItem = SafeUser & {
  [key: string]: unknown;
};

/**
 * Tenant API
 */
export const tenantApi = {
  /**
   * Get all tenants (scoped by permissions)
   */
  getAll: async (filters?: Record<string, unknown>) => {
    const response = await apiClient.get<TenantWithStats[]>(`${ADMIN_BASE}/tenants`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get tenant by ID
   */
  getById: async (id: string) => {
    const response = await apiClient.get<TenantWithStats>(`${ADMIN_BASE}/tenants/${id}`);
    return response.data;
  },

  /**
   * Create new tenant (super admin only)
   */
  create: async (data: Partial<Tenant>) => {
    const response = await apiClient.post<TenantWithStats>(`${ADMIN_BASE}/tenants`, data);
    return response.data;
  },

  /**
   * Update tenant
   */
  update: async (id: string, data: Partial<Tenant>) => {
    const response = await apiClient.patch<TenantWithStats>(`${ADMIN_BASE}/tenants/${id}`, data);
    return response.data;
  },

  /**
   * Delete tenant (super admin only)
   */
  delete: async (id: string) => {
    await apiClient.delete(`${ADMIN_BASE}/tenants/${id}`);
  },

  /**
   * Suspend tenant (super admin only)
   */
  suspend: async (id: string) => {
    const response = await apiClient.post<Tenant>(`${ADMIN_BASE}/tenants/${id}/suspend`);
    return response.data;
  },

  /**
   * Activate tenant (super admin only)
   */
  activate: async (id: string) => {
    const response = await apiClient.post<Tenant>(`${ADMIN_BASE}/tenants/${id}/activate`);
    return response.data;
  },
};

/**
 * User API
 */
export const userApi = {
  /**
   * Get all users (scoped by permissions)
   */
  getAll: async (filters?: Record<string, unknown>) => {
    const response = await apiClient.get<UserListItem[]>(`${ADMIN_BASE}/users`, {
      params: filters,
    });
    // Admin endpoints return raw data (not wrapped in ApiResponse)
    return response.data;
  },

  /**
   * Get user by ID
   */
  getById: async (id: string) => {
    const response = await apiClient.get<SafeUser>(`${ADMIN_BASE}/users/${id}`);
    return response.data;
  },

  /**
   * Create new user
   */
  create: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    tenantId?: string;
    roleId: string;
  }) => {
    const response = await apiClient.post<SafeUser>(`${ADMIN_BASE}/users`, data);
    return response.data;
  },

  /**
   * Update user
   */
  update: async (
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      roleId?: string;
      status?: string;
    },
  ) => {
    const response = await apiClient.patch<SafeUser>(`${ADMIN_BASE}/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user
   */
  delete: async (id: string) => {
    await apiClient.delete(`${ADMIN_BASE}/users/${id}`);
  },

  /**
   * Impersonate user (admin feature)
   */
  impersonate: async (id: string) => {
    const response = await apiClient.post<{ accessToken: string }>(
      `${ADMIN_BASE}/users/${id}/impersonate`,
    );
    return response.data;
  },
};

/**
 * Role API
 */
export const roleApi = {
  /**
   * Get all roles (scoped by permissions)
   */
  getAll: async (filters?: Record<string, unknown>) => {
    const response = await apiClient.get<RoleWithStats[]>(`${ADMIN_BASE}/roles`, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get role by ID
   */
  getById: async (id: string) => {
    const response = await apiClient.get<Role>(`${ADMIN_BASE}/roles/${id}`);
    return response.data;
  },

  /**
   * Create new role
   */
  create: async (data: {
    name: string;
    description?: string;
    permissions: string[];
    type?: string;
    tenantId?: string;
  }) => {
    const response = await apiClient.post<RoleWithStats>(`${ADMIN_BASE}/roles`, data);
    return response.data;
  },

  /**
   * Update role
   */
  update: async (
    id: string,
    data: {
      name?: string;
      description?: string;
      permissions?: string[];
      status?: string;
    },
  ) => {
    const response = await apiClient.patch<RoleWithStats>(`${ADMIN_BASE}/roles/${id}`, data);
    return response.data;
  },

  /**
   * Delete role
   */
  delete: async (id: string) => {
    await apiClient.delete(`${ADMIN_BASE}/roles/${id}`);
  },

  /**
   * Assign permissions to role
   */
  assignPermissions: async (id: string, permissions: string[]) => {
    const response = await apiClient.post<Role>(`${ADMIN_BASE}/roles/${id}/permissions`, {
      permissions,
    });
    return response.data;
  },
};

/**
 * Permission API
 */
export const permissionApi = {
  /**
   * Get all permissions
   */
  getAll: async () => {
    const response = await apiClient.get<Permission[]>(`${ADMIN_BASE}/permissions`);
    return response.data;
  },

  /**
   * Get permissions by category
   */
  getByCategory: async (category: string) => {
    const response = await apiClient.get<Permission[]>(`${ADMIN_BASE}/permissions`, {
      params: { category },
    });
    return response.data;
  },

  /**
   * Get role permissions
   */
  getRolePermissions: async (roleId: string) => {
    const response = await apiClient.get<Permission[]>(`${ADMIN_BASE}/permissions/role/${roleId}`);
    return response.data;
  },

  /**
   * Get user permissions
   */
  getUserPermissions: async (userId: string) => {
    const response = await apiClient.get<Permission[]>(`${ADMIN_BASE}/permissions/user/${userId}`);
    return response.data;
  },
};

/**
 * Combined admin API with convenience methods
 */
export const adminApi = {
  // Tenant methods
  getTenants: tenantApi.getAll,
  getTenant: tenantApi.getById,
  createTenant: tenantApi.create,
  updateTenant: tenantApi.update,
  deleteTenant: tenantApi.delete,
  suspendTenant: tenantApi.suspend,
  activateTenant: tenantApi.activate,

  // User methods
  getUsers: userApi.getAll,
  getUser: userApi.getById,
  createUser: userApi.create,
  updateUser: userApi.update,
  deleteUser: userApi.delete,
  impersonateUser: userApi.impersonate,

  // Role methods
  getRoles: roleApi.getAll,
  getRole: roleApi.getById,
  createRole: roleApi.create,
  updateRole: roleApi.update,
  deleteRole: roleApi.delete,
  assignPermissions: roleApi.assignPermissions,

  // Permission methods
  getPermissions: permissionApi.getAll,
  getPermissionsByCategory: permissionApi.getByCategory,
  getRolePermissions: permissionApi.getRolePermissions,
  getUserPermissions: permissionApi.getUserPermissions,

  // Namespaced API (for more explicit usage)
  tenants: tenantApi,
  users: userApi,
  roles: roleApi,
  permissions: permissionApi,
};
