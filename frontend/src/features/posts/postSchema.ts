import * as z from 'zod';

export const createPostSchema = z.object({
  title: z.string().trim().max(100, 'At most 100 characters'),
  content: z.string().trim().max(5000, 'At most 5000 characters'),
});

export type CreatePostValues = z.infer<typeof createPostSchema>;
