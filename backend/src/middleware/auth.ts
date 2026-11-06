import { type RequestHandler } from 'express';
import { jwtVerify } from 'jose';
import { prisma } from '../db/prisma.js';
import { getJwtSecret } from '../utils/jwt.js';

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.access_token;

  if (typeof token !== 'string') {
    return res.status(401).json({
      error: 'Authentication required',
    });
  }

  const secret = getJwtSecret();

  let payload;

  try {
    const result = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    payload = result.payload;
  } catch {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }

  const userId = Number(payload.sub);

  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(401).json({
      error: 'Invalid token',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    return res.status(401).json({
      error: 'User not found',
    });
  }

  req.user = user;

  return next();
};
