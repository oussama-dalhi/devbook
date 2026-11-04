import { type ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // prevents sending multiple responses if headers are already sent
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  return res.status(500).json({
    error: 'Internal Server Error',
  });
};
