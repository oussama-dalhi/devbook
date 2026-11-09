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

  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

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
