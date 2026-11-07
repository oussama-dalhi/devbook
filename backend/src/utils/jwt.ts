import { SignJWT } from 'jose';

export const getJwtSecret = (): Uint8Array => {
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
   if (secretKey.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }

  return new TextEncoder().encode(secretKey);
};

export const createAccessToken = async (userId: number): Promise<string> => {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getJwtSecret());
};
