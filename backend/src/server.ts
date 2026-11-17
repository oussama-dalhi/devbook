import { app } from './app.js';
import { prisma } from './db/prisma.js';
import { getJwtSecret } from './utils/jwt.js';

getJwtSecret();

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT configuration: "${process.env.PORT}"`);
}

const host = process.env.HOST || '0.0.0.0';

const server = app.listen(port, host, () => {
  console.log(`Backend running on http://${host}:${port}`);
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

const shutdown = (signal: string) => {
  console.log(`${signal} received, shutting down`);

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();

  server.close((closeError) => {
    prisma
      .$disconnect()
      .catch((e: unknown) => console.error('Error closing database connection:', e))
      .finally(() => process.exit(closeError ? 1 : 0));
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
