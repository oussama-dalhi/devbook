import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import * as z from 'zod';
import { prisma } from '../db/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { DUMMY_HASH, hashPassword, verifyPassword } from '../utils/password.js';
import { createAccessToken } from '../utils/jwt.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../middleware/rate-limit.js';

export const authRouter = Router();

const REFRESH_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

const accessCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 15 * 60 * 1000,
  path: '/',
});

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: REFRESH_LIFETIME_MS,
  path: '/api/auth',
});

const hashRefreshToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const createRefreshToken = () => randomBytes(32).toString('base64url');

const clearAuthCookies = (res: import('express').Response) => {
  res.clearCookie('access_token', accessCookieOptions());
  res.clearCookie('refresh_token', refreshCookieOptions());
};

const setAuthCookies = (
  res: import('express').Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie('access_token', accessToken, accessCookieOptions());
  res.cookie('refresh_token', refreshToken, refreshCookieOptions());
};

const sessionExpired = (res: import('express').Response) => {
  clearAuthCookies(res);
  return res.status(401).json({ error: 'Session expired' });
};

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, {
      message:
        'Username can only contain lowercase letters, numbers, and underscores',
    }),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  password: z.string().min(8).max(100),
});

authRouter.post('/register', registerLimiter, async (req, res) => {
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

authRouter.post('/login', loginLimiter, async (req, res) => {
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
  const verified = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );

  if (!user || !verified) {
    return res.status(401).json({
      error: 'Invalid credentials',
    });
  }
  const jwtToken = await createAccessToken(user.id);
  const refreshToken = createRefreshToken();
  await prisma.refreshSession.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_LIFETIME_MS),
    },
  });
  setAuthCookies(res, jwtToken, refreshToken);

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
    },
  });
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (typeof token !== 'string' || token.length === 0)
    return sessionExpired(res);

  const tokenHash = hashRefreshToken(token);
  const session = await prisma.refreshSession.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: { id: true },
      },
    },
  });

  if (!session || session.expiresAt <= new Date() || !session.user) {
    if (session) {
      await prisma.refreshSession.deleteMany({
        where: { id: session.id, tokenHash },
      });
    }
    return sessionExpired(res);
  }

  const nextRefreshToken = createRefreshToken();
  const nextHash = hashRefreshToken(nextRefreshToken);
  const accessToken = await createAccessToken(session.user.id);
  const rotated = await prisma.refreshSession.updateMany({
    where: {
      id: session.id,
      tokenHash,
      expiresAt: { gt: new Date() },
    },
    data: {
      tokenHash: nextHash,
      expiresAt: new Date(Date.now() + REFRESH_LIFETIME_MS),
    },
  });

  if (rotated.count !== 1) return sessionExpired(res);

  setAuthCookies(res, accessToken, nextRefreshToken);
  return res.status(200).json({ message: 'Session refreshed' });
});

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (typeof token === 'string' && token.length > 0) {
    await prisma.refreshSession.deleteMany({
      where: { tokenHash: hashRefreshToken(token) },
    });
  }

  clearAuthCookies(res);

  return res.status(200).json({
    message: 'Logged out successfully',
  });
});

authRouter.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
});
