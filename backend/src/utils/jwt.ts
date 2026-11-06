import { SignJWT } from 'jose';

export const getJwtSecret = (): Uint8Array => {
  const secretKey = process.env.JWT_SECRET;

  if (!secretKey) {
    throw new Error('JWT_SECRET is not configured');
  }

  return new TextEncoder().encode(secretKey);
};

export const createAccessToken = async (userId: number): Promise<string> => {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }

  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getJwtSecret());
  return token;
};
