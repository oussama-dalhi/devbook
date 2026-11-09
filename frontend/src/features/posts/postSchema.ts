import * as z from 'zod';

export const POST_TITLE_MAX_LENGTH = 100;
export const POST_CONTENT_MAX_LENGTH = 5000;

export const postFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .max(POST_TITLE_MAX_LENGTH, `At most ${POST_TITLE_MAX_LENGTH} characters`),
  content: z
    .string()
    .trim()
    .max(
      POST_CONTENT_MAX_LENGTH,
      `At most ${POST_CONTENT_MAX_LENGTH} characters`,
    ),
});

export type PostFieldsValues = z.infer<typeof postFieldsSchema>;
