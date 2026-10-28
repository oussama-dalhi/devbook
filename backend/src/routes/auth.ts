import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const authRouter = Router();

authRouter.get('/', (_req, res) => {
    res.json({ message: "Auth routes are working"});
});