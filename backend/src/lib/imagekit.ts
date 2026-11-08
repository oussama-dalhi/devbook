import ImageKit from '@imagekit/nodejs';
import 'dotenv/config';

const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

if (!privateKey) {
  throw new Error('IMAGEKIT_PRIVATE_KEY is not configured');
}

export const imagekit = new ImageKit({
  privateKey,
});
