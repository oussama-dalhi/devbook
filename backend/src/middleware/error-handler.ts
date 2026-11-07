import { type ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  // prevents sending multiple responses if headers are already sent
  if (res.headersSent) return next(err);
  const status = err?.status ?? err?.statusCode;
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return res.status(status).json({
      error: status === 413 ? 'Payload too large' : 'Invalid request',
    });
  }

  console.error(err);
  return res.status(500).json({
    error: 'Internal Server Error',
  });
};
