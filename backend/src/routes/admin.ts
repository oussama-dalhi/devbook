import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/authorization.js';

export const adminRouter = Router();

adminRouter.get('/dashboard', requireAuth, requireRole('ADMIN'), (_req, res) => {
  return res.json({
    message: 'Welcome to the Devbook admin dashboard',
  });
});


