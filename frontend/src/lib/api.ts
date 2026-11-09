export type ApiIssue = {
  path: (string | number)[];
  message: string;
};

export class ApiError extends Error {
  status: number;
  issues?: ApiIssue[];

  constructor(message: string, status: number, issues?: ApiIssue[]) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

const shouldSkipRefresh = (path: string) =>
  ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'].includes(
    path.split('?')[0],
  );

const refreshSession = (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
};

const isApiIssue = (value: unknown): value is ApiIssue =>
  typeof value === 'object' &&
  value !== null &&
  'path' in value &&
  Array.isArray(value.path) &&
  value.path.every(
    (part) => typeof part === 'string' || typeof part === 'number',
  ) &&
  'message' in value &&
  typeof value.message === 'string';

// Validation problems arrive as `issues`, or as `errors` from routes that
// have not been moved to the new format yet.
const readIssues = (response: object): ApiIssue[] | undefined => {
  const raw =
    'issues' in response
      ? response.issues
      : 'errors' in response
        ? response.errors
        : undefined;

  if (!Array.isArray(raw)) return undefined;

  const issues = raw.filter(isApiIssue);
  return issues.length > 0 ? issues : undefined;
};

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

  const fetchRequest = () =>
    fetch(`/api${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });

  let res = await fetchRequest();
  if (res.status === 401 && !shouldSkipRefresh(path) && (await refreshSession())) {
    res = await fetchRequest();
  }

  const data: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const response = typeof data === 'object' && data !== null ? data : null;
    const issues = response ? readIssues(response) : undefined;

    const message =
      issues?.[0]?.message ??
      (response && 'error' in response && typeof response.error === 'string'
        ? response.error
        : `Request failed (${res.status})`);

    throw new ApiError(message, res.status, issues);
  }

  return data as T;
};
