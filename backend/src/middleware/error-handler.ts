import { type ErrorRequestHandler } from 'express';
import multer from 'multer';
import { HttpError } from '../utils/http-error.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: err.message,
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'Image must be 5 MB or smaller.',
      });
    }

    return res.status(400).json({ error: err.message });
  }

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
