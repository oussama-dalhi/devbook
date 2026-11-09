import * as z from 'zod';

export const POST_CONTENT_MAX_LENGTH = 5000;

export const createPostSchema = z.object({
  title: z.string().trim().max(100, 'At most 100 characters'),
  content: z.string().trim().max(POST_CONTENT_MAX_LENGTH, `At most ${POST_CONTENT_MAX_LENGTH} characters`),
});

export type CreatePostValues = z.infer<typeof createPostSchema>;
