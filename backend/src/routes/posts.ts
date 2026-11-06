import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import * as z from 'zod';

const postsRouter = Router();

const createPostSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    content: z.string().trim().min(1).max(500).optional(),
    imageUrl: z.url({ protocol: /^https?$/ }).max(2048).optional(),
  }).strict()
  .refine((data) => data.content || data.imageUrl, {
    message: 'A post must contain text or an image',
  });

postsRouter.post('/', requireAuth, async (req, res) => {
  const result = createPostSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      errors: result.error.issues,
    });
  }
  const { title, content, imageUrl } = result.data;
  const post = await prisma.post.create({
    data: {
      authorId: req.user!.id,
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(imageUrl !== undefined && { imageUrl }),
    },
  });

  return res.status(201).json({
    post,
  });
});

const updateSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    content: z.string().trim().min(1).max(500).optional(),
    imageUrl: z.url({ protocol: /^https?$/ }).max(2048).optional(),
  })
  .strict()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'At least one field must be provided',
  });
const postIdSchema = z.coerce.number().int().positive();
postsRouter.patch('/:postId', requireAuth, async (req, res) => {
  const result = postIdSchema.safeParse(req.params.postId);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid post ID',
    });
  }
  const postId = result.data;
  const updateResult = updateSchema.safeParse(req.body);
  if (!updateResult.success) {
    return res.status(400).json({
      error: updateResult.error.issues,
    });
  }
  const { title, content, imageUrl } = updateResult.data;
  try {
    const post = await prisma.post.update({
      where: {
        id: postId,
        authorId: req.user!.id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });
    return res.status(200).json({ post });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }

    throw error;
  }
});

postsRouter.delete('/:postId', requireAuth, async (req, res) => {
  const result = postIdSchema.safeParse(req.params.postId);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid post ID',
    });
  }
  const postId = result.data;
  try {
    await prisma.post.delete({
      where: {
        id: postId,
        authorId: req.user!.id,
      },
    });
    return res.status(204).send();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({
        error: 'Post not found',
      });
    }

    throw error;
  }
});

export default postsRouter;
