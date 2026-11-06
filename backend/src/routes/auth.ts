import { Router } from 'express';
import * as z from 'zod';
import { prisma } from '../db/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { createAccessToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(30),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(8).max(100),
});

authRouter.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      errors: result.error.issues,
    });
  }

  const { username, name, email, password } = result.data;
  const passwordHash = await hashPassword(password);
  try {
    const user = await prisma.user.create({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
      },
      data: {
        username,
        name,
        email,
        passwordHash,
      },
    });

    return res.status(201).json({ user });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      return res.status(409).json({
        error: 'Username or email already exists',
      });
    }
    throw e;
  }
});

authRouter.get('/', (_req, res) => {
  res.json({ message: 'Auth routes are working' });
});

const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(3).max(254),
  password: z.string().min(8).max(100),
});

authRouter.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      errors: result.error.issues,
    });
  }
  const { identifier, password } = result.data;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      passwordHash: true,
    },
  });
  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
    });
  }
  const verified = await verifyPassword(password, user.passwordHash);
  if (!verified) {
    return res.status(401).json({
      error: 'Invalid credentials',
    });
  }
  const jwtToken = await createAccessToken(user.id);
  res.cookie('access_token', jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  });

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
    },
  });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('access_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return res.status(200).json({
    message: 'Logged out successfully',
  });
});

authRouter.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
});
