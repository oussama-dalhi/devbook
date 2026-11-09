import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache,
} from '@tanstack/react-query';
import { ApiError } from '@/lib/api';

import './index.css';
import App from './App.tsx';

const handleUnauthorized = (error: Error) => {
  if (error instanceof ApiError && error.status === 401) {
    queryClient.setQueryData(['me'], null);
  }
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleUnauthorized }),
  mutationCache: new MutationCache({ onError: handleUnauthorized }),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
