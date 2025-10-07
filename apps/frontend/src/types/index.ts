/**
 * Common TypeScript type definitions
 */

// User and Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  businessId?: string;
}

export type UserRole = 'owner' | 'admin' | 'staff' | 'receptionist';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// UI State types
export interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
}

// Navigation types
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
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
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
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
