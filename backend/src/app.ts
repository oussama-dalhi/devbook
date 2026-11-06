import express, { type Request, type Response } from 'express';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import cookieParser from 'cookie-parser';

export const app = express();

app.disable('x-powered-by');
// Parse JSON
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World');
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
  });
});

app.use('/api/auth', authRouter);
app.use(errorHandler);
