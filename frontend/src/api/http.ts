/**
 * Thin wrapper over `fetch`: attaches the JWT, parses JSON, turns failures
 * into ApiError, and forces a re-login on `401`.
 * Every other `api/*` module is built on the exported `api` object below.
 */

const BASE_URL = '/api';
const TOKEN_KEY = 'raft_token';

/** Error thrown for any non-OK response; carries the HTTP `status`. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Extracts a user-facing message from an unknown error (falls back to a generic one). */
export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Something went wrong. Try again.';
}

/** Reads the stored JWT, or `null` if the user isn't logged in. */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Persists the JWT (called after login). */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Removes the stored JWT (called on logout or `401`). */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Performs a request: adds the `Authorization` header and JSON content type,
 * redirects to `/login` on `401`, throws ApiError on failure, and
 * returns the parsed JSON body (or `undefined` for `204 No Content`).
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      message = `Request failed (${res.status})`;
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Typed helpers for each HTTP method; pass the path (without `/api`) and an optional body. */
export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
