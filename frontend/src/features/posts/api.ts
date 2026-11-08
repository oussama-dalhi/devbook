import type { PostsResponse } from './types';

export const getPosts = async (page: number): Promise<PostsResponse> => {
  const res = await fetch(`/api/posts?page=${page}`);

  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null);

    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : `Request failed (${res.status})`;

    throw new Error(message);
  }

  return res.json();
};
