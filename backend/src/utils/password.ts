import * as argon2 from 'argon2';

export const DUMMY_HASH = await argon2.hash('timing-verify');

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password);
};

export const verifyPassword = async (
  password: string,
  storedHash: string,
): Promise<boolean> => {
  return argon2.verify(storedHash, password);
};
