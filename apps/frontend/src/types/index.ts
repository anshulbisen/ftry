/**
 * Common TypeScript type definitions
 *
 * NOTE: Authentication types are imported from @ftry/shared/types
 * Do not duplicate User, AuthState, or other auth-related types here.
 */

// Re-export shared authentication types for convenience
export type {
  User,
  SafeUser,
  AuthState,
  Role,
  Tenant,
  Permission,
  UserWithRole,
  UserWithTenant,
  AuthResponse,
  LoginResponse,
  RegisterResponse,
  ApiResponse,
  ApiError,
} from '@ftry/shared/types';

// UI State types
export interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light' | 'system';
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  children?: NavItem[];
  isSection?: boolean;
}

export interface Breadcrumb {
  title: string;
  href?: string;
}

// Common entity types (placeholders for future development)
export interface Appointment {
  id: string;
  clientId: string;
  staffId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: 'cancelled' | 'completed' | 'confirmed' | 'scheduled';
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone: string;
  totalVisits: number;
  lastVisit?: string;
  notes?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  specializations: string[];
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number; // in minutes
  price: number;
  category: string;
}
