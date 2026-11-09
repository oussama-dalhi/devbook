import { request } from '@/lib/api';
import type { PostsResponse } from './types';

export const getPosts = (page: number) =>
  request<PostsResponse>(`/posts?page=${page}`);
