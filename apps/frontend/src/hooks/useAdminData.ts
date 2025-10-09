import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin';
import type { SafeUser, Role, Tenant } from '@ftry/shared/types';

/**
 * useAdminData Hook
 *
 * Provides data fetching hooks for admin features with automatic
 * permission-based scoping on the backend.
 *
 * All queries automatically scope data based on user permissions:
 * - Super admin: sees all data across all tenants
 * - Tenant admin: sees only data within their tenant
 */

/**
 * Fetch users with automatic scoping
 */
export const useUsers = (filters?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: () => adminApi.users.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch tenants with automatic scoping
 */
export const useTenants = (filters?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['admin', 'tenants', filters],
    queryFn: () => adminApi.tenants.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch roles with automatic scoping
 */
export const useRoles = (filters?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['admin', 'roles', filters],
    queryFn: () => adminApi.roles.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch all available permissions
 */
export const useAllPermissions = () => {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: () => adminApi.permissions.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes - permissions rarely change
  });
};

/**
 * Create user mutation
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      tenantId?: string;
      roleId: string;
    }) => adminApi.users.create(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

/**
 * Update user mutation
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        roleId?: string;
        status?: string;
      };
    }) => adminApi.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

/**
 * Delete user mutation
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.users.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

/**
 * Create tenant mutation
 */
export const useCreateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Tenant>) => adminApi.tenants.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
};

/**
 * Update tenant mutation
 */
export const useUpdateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) =>
      adminApi.tenants.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
};

/**
 * Delete tenant mutation
 */
export const useDeleteTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => adminApi.tenants.delete(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
};

/**
 * Suspend tenant mutation
 */
export const useSuspendTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => adminApi.tenants.suspend(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
};

/**
 * Activate tenant mutation
 */
export const useActivateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => adminApi.tenants.activate(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
    },
  });
};

/**
 * Create role mutation
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      permissions: string[];
      type?: string;
      tenantId?: string;
    }) => adminApi.roles.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
};

/**
 * Update role mutation
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        description?: string;
        permissions?: string[];
        status?: string;
      };
    }) => adminApi.roles.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
};

/**
 * Delete role mutation
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => adminApi.roles.delete(roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    },
  });
};
