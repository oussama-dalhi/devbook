export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const request = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const headers = new Headers(init?.headers);

  if (init?.body && !(init.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }
  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
};
