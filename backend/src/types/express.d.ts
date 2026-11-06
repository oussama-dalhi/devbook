export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        name: string;
        email: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}
