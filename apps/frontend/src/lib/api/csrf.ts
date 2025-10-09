/**
 * CSRF Token Management Utility
 *
 * Provides functions to fetch and manage CSRF tokens for protecting
 * state-changing requests (POST, PUT, PATCH, DELETE) against CSRF attacks.
 *
 * Implementation uses the Double Submit Cookie Pattern:
 * - Backend sets a secure, httpOnly cookie containing CSRF token
 * - Frontend fetches token and includes it in request headers
 * - Backend validates token matches cookie value
 */

let csrfToken: string | null = null;

/**
 * Fetches a CSRF token from the backend.
 * Caches the token to avoid unnecessary requests.
 *
 * @returns Promise resolving to the CSRF token
 * @throws Error if token fetch fails
 */
export async function getCsrfToken(): Promise<string> {
  // Return cached token if available
  if (csrfToken) {
    return csrfToken;
  }

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    const response = await fetch(`${API_URL}/auth/csrf`, {
      method: 'GET',
      credentials: 'include', // Include cookies (required for CSRF cookie)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status} ${response.statusText}`);
    }

    // The backend returns the token in the X-CSRF-Token header
    const token = response.headers.get('x-csrf-token');

    if (!token) {
      throw new Error('CSRF token not found in response headers');
    }

    csrfToken = token;
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    throw error;
  }
}

/**
 * Clears the cached CSRF token.
 * Useful when token becomes invalid (e.g., after 403 error).
 */
export function clearCsrfToken(): void {
  csrfToken = null;
}

/**
 * Prefetches CSRF token without returning it.
 * Useful for warming up the token cache on app initialization.
 */
export async function prefetchCsrfToken(): Promise<void> {
  try {
    await getCsrfToken();
  } catch (error) {
    console.error('Failed to prefetch CSRF token:', error);
    // Don't throw - prefetch is best-effort
  }
}
