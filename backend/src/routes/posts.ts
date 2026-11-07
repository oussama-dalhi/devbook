import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import * as z from 'zod';

export const postsRouter = Router();

const postBody = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    content: z.string().trim().min(1).max(500).optional(),
    imageUrl: z
      .url({ protocol: /^https?$/ })
      .max(2048)
      .optional(),
  })
  .strict();

const createPostSchema = postBody.refine((d) => d.content || d.imageUrl, {
  message: 'A post must contain text or an image',
});

const updatePostSchema = postBody.refine(
  (d) => Object.values(d).some((v) => v !== undefined),
  { message: 'At least one field must be provided' },
);

const postSelect = {
  id: true,
  title: true,
  content: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, username: true, name: true } },
} satisfies Prisma.PostSelect;

// POST endpoints

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
    select: postSelect,
  });

  return res.status(201).json({
    post,
  });
});


const postIdSchema = z.coerce.number().int().positive().max(2_147_483_647);
postsRouter.patch('/:postId', requireAuth, async (req, res) => {
  const result = postIdSchema.safeParse(req.params.postId);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid post ID',
    });
  }
  const postId = result.data;
  const updateResult = updatePostSchema.safeParse(req.body);
  if (!updateResult.success) {
    return res.status(400).json({
      errors: updateResult.error.issues,
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
      select: postSelect,
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

// GET endpoints

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

postsRouter.get('/', async (req, res) => {
  const result = paginationSchema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({
      errors: result.error.issues,
    });
  }

  const { page, limit } = result.data;
  const skip = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: postSelect,
    }),
    prisma.post.count(),
  ]);
  const hasNextPage = skip + posts.length < total;
  const hasPreviousPage = page > 1;
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  });
});

postsRouter.get('/:postId', async (req, res) => {
  const result = postIdSchema.safeParse(req.params.postId);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid post ID',
    });
  }
  const post = await prisma.post.findUnique({
    where: {
      id: result.data,
    },
    select: postSelect,
  });
  if (!post) {
    return res.status(404).json({
      error: 'Post not found',
    });
  }
  return res.status(200).json({ post });
});

