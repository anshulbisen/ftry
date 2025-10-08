/**
 * Redis Module Constants
 */

/**
 * Injection token for the shared Redis client
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Redis connection states
 */
export enum RedisConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  READY = 'ready',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}
