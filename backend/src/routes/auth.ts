import { Router } from 'express';
import * as z from 'zod';
import { prisma } from '../db/prisma.js';
import { Prisma } from '../generated/prisma/client.js';
import { hashPassword } from '../utils/password.js';

export const authRouter = Router();

const registerSchema = z.object({
  username: z.string().trim().min(3).max(30),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().max(254).pipe(z.email()),
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
