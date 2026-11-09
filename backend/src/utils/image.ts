import { toFile } from '@imagekit/nodejs';
import { fileTypeFromBuffer } from 'file-type';
import { imagekit } from '../lib/imagekit.js';
import { HttpError } from './http-error.js';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

export const uploadImage = async (
  file: Express.Multer.File,
): Promise<{ url: string; fileId: string }> => {
  // Inspect the actual file contents
  const detectedType = await fileTypeFromBuffer(file.buffer);

  if (
    !detectedType ||
    !allowedTypes.includes(detectedType.mime) ||
    detectedType.mime !== file.mimetype
  ) {
    throw new HttpError(400, 'Invalid or unsupported image file');
  }

  // Upload to ImageKit
  const response = await imagekit.files.upload({
    file: await toFile(file.buffer, file.originalname),
    fileName: file.originalname,
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
