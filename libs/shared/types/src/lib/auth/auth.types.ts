/**
 * Shared Authentication Types
 * Used across frontend and backend for type safety
 */

// Base entities
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  tenantId: string | null;
  roleId: string;
  status: string;
  isDeleted: boolean;
  loginAttempts: number;
  lockedUntil: Date | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  tenantId: string | null;
  type: string;
  level: number;
  isSystem: boolean;
  isDefault: boolean;
  metadata?: JsonValue | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// JsonValue type compatible with Prisma's Json type
// Using 'any' here to match Prisma's actual JsonValue type which is complex
// In production, Prisma generates the proper type from @prisma/client
export type JsonValue = any;

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiry?: Date | null;
  maxUsers: number;
  settings?: JsonValue | null;
  metadata?: JsonValue | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string | null;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// Composite types
export type UserWithRole = User & {
  role: Role;
};

export type UserWithTenant = User & {
  tenant: Tenant | null;
};

// User with password field (for internal backend use only)
export type UserWithRelations = User & {
  password: string; // Include password for internal use
  role: Role;
  tenant: Tenant | null;
};

export type UserWithPermissions = UserWithRelations & {
  permissions: string[];
  additionalPermissions?: string[];
};

// User without password - removes password from UserWithRelations
export type UserWithoutPassword = Omit<UserWithRelations, 'password'>;

// Safe user for client consumption - removes sensitive authentication fields but keeps relations
export type SafeUser = Omit<User, 'lockedUntil' | 'loginAttempts'> & {
  role: Role;
  tenant: Tenant | null;
  permissions: string[];
};

// JWT related
export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string | null;
  roleId: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date | null;
  revokedReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// RefreshToken with user relation for internal use
export interface RefreshTokenWithUser extends RefreshToken {
  user: UserWithRelations;
}

// API Responses
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse extends ApiResponse<AuthResponse> {
  message: 'Login successful';
}

export interface RegisterResponse extends ApiResponse<SafeUser> {
  message: 'User registered successfully';
}

// DTOs
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tenantId?: string;
  roleId: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

// Request types
export interface AuthenticatedRequest {
  user: UserWithPermissions;
}

// Permission types
export interface PermissionsMetadata {
  permissions: string[];
  requireAll: boolean;
}

// Auth State Types (for frontend state management)
export type AuthState =
  | { type: 'authenticated'; user: SafeUser; accessToken: string; refreshToken: string }
  | { type: 'authenticating' }
  | { type: 'error'; error: string }
  | { type: 'refreshing'; user: SafeUser; refreshToken: string }
  | { type: 'unauthenticated' };

// User Management DTOs
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  tenantId?: string;
  roleId: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  status?: string;
}

// Role Management DTOs
export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: string[];
  tenantId?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
  status?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Error types
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
}

// Type Guards
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    'message' in error &&
    typeof (error as ApiError).statusCode === 'number' &&
    typeof (error as ApiError).message === 'string'
  );
}

export function isSafeUser(user: unknown): user is SafeUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'email' in user &&
    'role' in user &&
    typeof (user as SafeUser).id === 'string' &&
    typeof (user as SafeUser).email === 'string'
  );
}

export function isAuthResponse(response: unknown): response is AuthResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'user' in response &&
    'accessToken' in response &&
    'refreshToken' in response &&
    'expiresIn' in response &&
    isSafeUser((response as AuthResponse).user) &&
    typeof (response as AuthResponse).accessToken === 'string' &&
    typeof (response as AuthResponse).refreshToken === 'string' &&
    typeof (response as AuthResponse).expiresIn === 'number'
  );
}

// Axios Error Type for better error handling
export interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string;
      statusCode?: number;
    };
    status?: number;
  };
  message?: string;
  code?: string; // Error codes like 'ECONNABORTED', 'ERR_NETWORK', etc.
  config?: {
    url?: string;
  };
}

export function isAxiosError(error: unknown): error is AxiosErrorResponse {
  return typeof error === 'object' && error !== null && 'response' in error;
}
