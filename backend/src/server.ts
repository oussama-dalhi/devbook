import { app } from './app.js';

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error('Invalid PORT configuration');
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend running on port ${port}`);
});