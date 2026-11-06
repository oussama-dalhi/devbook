import type { RequestHandler } from 'express';

type UserRole = NonNullable<Express.Request['user']>['role'];

export const requireRole = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
      });
    }

    return next();
  };
};
