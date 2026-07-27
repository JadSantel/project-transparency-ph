/**
 * Thin fetch wrapper around the API. Every endpoint under VITE_API_BASE_URL
 * responds with either `{ data, meta? }` on success or `{ error: { message,
 * ... } }` on failure (see apps/api/src/middlewares/errorHandler.ts) — this
 * client normalizes both into either a resolved value or a thrown ApiError,
 * so callers (React Query hooks) never have to think about response shape.
 */
import { getAccessToken } from './authToken';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: ApiRequestOptions['query']): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = options;

  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  // 204 No Content (DELETE) has no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // errorHandler.ts sends either { error: "message" } for AppErrors, or
    // { error: "ValidationError", details } for Zod failures.
    const message =
      typeof payload?.error === 'string' && payload.error !== 'ValidationError'
        ? payload.error
        : (payload?.details?.formErrors?.[0] ?? 'Request failed');
    throw new ApiError(message, response.status);
  }

  return payload as T;
}
