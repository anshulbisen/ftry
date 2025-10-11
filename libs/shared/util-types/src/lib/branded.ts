/**
 * Branded Types for Domain Modeling
 *
 * Provides compile-time type safety for primitive types that represent
 * different domain concepts. Prevents accidental mixing of IDs and
 * other domain-specific values.
 */

/**
 * Base type for creating branded types
 */
export type Brand<K, T = string> = K & { readonly __brand: T };

/**
 * Common branded types for the ftry application
 */

// User and authentication related
export type UserId = Brand<string, 'UserId'>;
export type TenantId = Brand<string, 'TenantId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type ApiKey = Brand<string, 'ApiKey'>;

// Business entities
export type ClientId = Brand<string, 'ClientId'>;
export type StaffId = Brand<string, 'StaffId'>;
export type AppointmentId = Brand<string, 'AppointmentId'>;
export type ServiceId = Brand<string, 'ServiceId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type InvoiceId = Brand<string, 'InvoiceId'>;
export type PaymentId = Brand<string, 'PaymentId'>;

// Time-related
export type Timestamp = Brand<number, 'Timestamp'>;
export type Duration = Brand<number, 'Duration'>; // in milliseconds

// Financial
export type Money = Brand<number, 'Money'>; // in smallest currency unit (paise)
export type Percentage = Brand<number, 'Percentage'>; // 0-100
export type TaxRate = Brand<number, 'TaxRate'>; // GST rate

// Contact information
export type Email = Brand<string, 'Email'>;
export type PhoneNumber = Brand<string, 'PhoneNumber'>;
export type GSTNumber = Brand<string, 'GSTNumber'>;

/**
 * Helper functions to create branded values
 */
export const BrandedTypes = {
  // User and auth
  userId: (id: string): UserId => id as UserId,
  tenantId: (id: string): TenantId => id as TenantId,
  sessionId: (id: string): SessionId => id as SessionId,
  apiKey: (key: string): ApiKey => key as ApiKey,

  // Business entities
  clientId: (id: string): ClientId => id as ClientId,
  staffId: (id: string): StaffId => id as StaffId,
  appointmentId: (id: string): AppointmentId => id as AppointmentId,
  serviceId: (id: string): ServiceId => id as ServiceId,
  productId: (id: string): ProductId => id as ProductId,
  invoiceId: (id: string): InvoiceId => id as InvoiceId,
  paymentId: (id: string): PaymentId => id as PaymentId,

  // Time-related
  timestamp: (ms: number): Timestamp => ms as Timestamp,
  duration: (ms: number): Duration => ms as Duration,

  // Financial
  money: (paise: number): Money => paise as Money,
  percentage: (value: number): Percentage => {
    if (value < 0 || value > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    return value as Percentage;
  },
  taxRate: (rate: number): TaxRate => {
    const validGSTRates = [0, 5, 12, 18, 28];
    if (!validGSTRates.includes(rate)) {
      throw new Error(`Invalid GST rate: ${rate}. Must be one of ${validGSTRates.join(', ')}`);
    }
    return rate as TaxRate;
  },

  // Contact information
  email: (email: string): Email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    return email as Email;
  },
  phoneNumber: (phone: string): PhoneNumber => {
    // Indian phone number validation
    const phoneRegex = /^[+]?91?[6-9]\d{9}$/;
    const cleaned = phone.replace(/[\s-()]/g, '');
    if (!phoneRegex.test(cleaned)) {
      throw new Error('Invalid Indian phone number');
    }
    return cleaned as PhoneNumber;
  },
  gstNumber: (gst: string): GSTNumber => {
    // GST number format validation
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst)) {
      throw new Error('Invalid GST number format');
    }
    return gst as GSTNumber;
  },
};

/**
 * Type guards for branded types
 */
export const BrandedTypeGuards = {
  isUserId: (value: unknown): value is UserId => {
    return typeof value === 'string' && value.length > 0;
  },

  isTenantId: (value: unknown): value is TenantId => {
    return typeof value === 'string' && value.length > 0;
  },

  isEmail: (value: unknown): value is Email => {
    if (typeof value !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  isPhoneNumber: (value: unknown): value is PhoneNumber => {
    if (typeof value !== 'string') return false;
    const phoneRegex = /^[+]?91?[6-9]\d{9}$/;
    return phoneRegex.test(value.replace(/[\s-()]/g, ''));
  },

  isMoney: (value: unknown): value is Money => {
    return typeof value === 'number' && value >= 0 && Number.isInteger(value);
  },

  isPercentage: (value: unknown): value is Percentage => {
    return typeof value === 'number' && value >= 0 && value <= 100;
  },

  isTaxRate: (value: unknown): value is TaxRate => {
    if (typeof value !== 'number') return false;
    const validGSTRates = [0, 5, 12, 18, 28];
    return validGSTRates.includes(value);
  },

  isTimestamp: (value: unknown): value is Timestamp => {
    return typeof value === 'number' && value > 0;
  },

  isDuration: (value: unknown): value is Duration => {
    return typeof value === 'number' && value >= 0;
  },
};

/**
 * Utility type to extract the underlying type from a branded type
 */
export type UnwrapBrand<T> = T extends Brand<infer U, any> ? U : T;

/**
 * Example usage in domain models:
 *
 * ```typescript
 * interface User {
 *   id: UserId;
 *   tenantId: TenantId;
 *   email: Email;
 *   phone?: PhoneNumber;
 * }
 *
 * interface Appointment {
 *   id: AppointmentId;
 *   clientId: ClientId;
 *   staffId: StaffId;
 *   serviceId: ServiceId;
 *   startTime: Timestamp;
 *   duration: Duration;
 *   price: Money;
 * }
 *
 * // Type safety in action:
 * function bookAppointment(
 *   clientId: ClientId,
 *   staffId: StaffId,
 *   serviceId: ServiceId
 * ): AppointmentId {
 *   // Implementation
 * }
 *
 * const clientId = BrandedTypes.clientId('cli_123');
 * const staffId = BrandedTypes.staffId('stf_456');
 * const userId = BrandedTypes.userId('usr_789');
 *
 * // This will cause a compile-time error:
 * // bookAppointment(userId, staffId, serviceId);
 * //                 ^^^^^^ Type 'UserId' is not assignable to type 'ClientId'
 *
 * // This is correct:
 * bookAppointment(clientId, staffId, serviceId);
 * ```
 */
