import { apiClient } from '../api-client';
import type {
  SafeUser,
  CreateUserDto,
  UpdateUserDto,
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  Permission,
  ApiResponse,
  PaginatedResponse,
} from '@ftry/shared/types';

/**
 * User Management API endpoints
 * TODO: Move to @ftry/frontend/user-management library
 */
export const userApi = {
  getUsers: async (): Promise<PaginatedResponse<SafeUser>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<SafeUser>>>('/users');
    if (!response.data.data) {
      throw new Error('Invalid response format');
    }
    return response.data.data;
  },

  getUserById: async (id: string): Promise<SafeUser> => {
    const response = await apiClient.get<ApiResponse<SafeUser>>(`/users/${id}`);
    if (!response.data.data) {
      throw new Error('User not found');
    }
    return response.data.data;
  },

  createUser: async (data: CreateUserDto): Promise<SafeUser> => {
    const response = await apiClient.post<ApiResponse<SafeUser>>('/users', data);
    if (!response.data.data) {
      throw new Error('Failed to create user');
    }
    return response.data.data;
  },

  updateUser: async (id: string, data: UpdateUserDto): Promise<SafeUser> => {
    const response = await apiClient.patch<ApiResponse<SafeUser>>(`/users/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update user');
    }
    return response.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/users/${id}`);
  },
};

/**
 * Role Management API endpoints
 * TODO: Move to @ftry/frontend/rbac library
 */
export const roleApi = {
  getRoles: async (): Promise<PaginatedResponse<Role>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Role>>>('/roles');
    if (!response.data.data) {
      throw new Error('Invalid response format');
    }
    return response.data.data;
  },

  getRoleById: async (id: string): Promise<Role> => {
    const response = await apiClient.get<ApiResponse<Role>>(`/roles/${id}`);
    if (!response.data.data) {
      throw new Error('Role not found');
    }
    return response.data.data;
  },

  createRole: async (data: CreateRoleDto): Promise<Role> => {
    const response = await apiClient.post<ApiResponse<Role>>('/roles', data);
    if (!response.data.data) {
      throw new Error('Failed to create role');
    }
    return response.data.data;
  },

  updateRole: async (id: string, data: UpdateRoleDto): Promise<Role> => {
    const response = await apiClient.patch<ApiResponse<Role>>(`/roles/${id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update role');
    }
    return response.data.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/roles/${id}`);
  },
};

/**
 * Permission Management API endpoints
 * TODO: Move to @ftry/frontend/rbac library
 */
export const permissionApi = {
  getPermissions: async (): Promise<PaginatedResponse<Permission>> => {
    const response =
      await apiClient.get<ApiResponse<PaginatedResponse<Permission>>>('/permissions');
    if (!response.data.data) {
      throw new Error('Invalid response format');
    }
    return response.data.data;
  },

  getPermissionById: async (id: string): Promise<Permission> => {
    const response = await apiClient.get<ApiResponse<Permission>>(`/permissions/${id}`);
    if (!response.data.data) {
      throw new Error('Permission not found');
    }
    return response.data.data;
  },
};
