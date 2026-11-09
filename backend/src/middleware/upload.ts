import multer from 'multer';
import type { Request } from 'express';
import { HttpError } from '../utils/http-error.js';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback,
) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(new HttpError(400, 'Only JPEG, PNG and WebP images are allowed'));
  }

  callback(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 5,
    fieldSize: 10 * 1024,
  },
});
