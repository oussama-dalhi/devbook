import express, { type Request, type Response } from 'express';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import cookieParser from 'cookie-parser';
import { adminRouter } from './routes/admin.js';
import { postsRouter } from './routes/posts.js';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const app = express();

app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'blob:', 'https://ik.imagekit.io'],
      },
    },
  }),
);
const trustProxy = process.env.TRUST_PROXY;
app.set(
  'trust proxy',
  trustProxy === undefined || trustProxy === ''
    ? false
    : trustProxy === 'true'
      ? true
      : trustProxy === 'false'
        ? false
        : /^\d+$/.test(trustProxy)
          ? Number(trustProxy)
          : trustProxy,
);
// Parse JSON
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/posts', postsRouter);

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../frontend/dist',
  );
  app.use(express.static(frontendDist));
  app.get(/.*/, (req, res, next) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) {
      next();
      return;
    }

    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});
app.use(errorHandler);
