import { useQuery } from '@tanstack/react-query';
import { ApiError, request } from '@/lib/api';

export type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

export const useMe = () =>
  useQuery({
    queryKey: ['me'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        const { user } = await request<{ user: User }>('/auth/me');
        return user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null; // not logged in
        throw e;
      }
    },
  });
