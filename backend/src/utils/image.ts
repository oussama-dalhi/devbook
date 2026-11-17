import { randomUUID } from 'node:crypto';
import { toFile } from '@imagekit/nodejs';
import { fileTypeFromBuffer } from 'file-type';
import { imagekit } from '../lib/imagekit.js';
import { HttpError } from './http-error.js';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadImage = async (
  file: Express.Multer.File,
): Promise<{ url: string; fileId: string }> => {
  let detectedType;
  try {
    detectedType = await fileTypeFromBuffer(file.buffer);
  } catch {
    throw new HttpError(400, 'Invalid or unsupported image file');
  }

  if (
    !detectedType ||
    !allowedTypes.includes(detectedType.mime) ||
    detectedType.mime !== file.mimetype
  ) {
    throw new HttpError(400, 'Invalid or unsupported image file');
  }

  const fileName = `${randomUUID()}.${detectedType.ext}`;
  const response = await imagekit.files.upload({
    file: await toFile(file.buffer, fileName),
    fileName,
    folder: '/devbook/posts',
  });

  if (!response.url || !response.fileId) {
    throw new Error('ImageKit upload did not return a URL or file ID');
  }

  return {
    url: response.url,
    fileId: response.fileId,
  };
};

export const deleteImage = async (fileId: string): Promise<void> => {
  await imagekit.files.delete(fileId);
};
