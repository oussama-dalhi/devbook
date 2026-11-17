import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ApiError } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

import './index.css';
import App from './App.tsx';

const handleUnauthorized = (error: Error, isMutation = false) => {
  if (error instanceof ApiError && error.status === 401) {
    if (isMutation && queryClient.getQueryData(queryKeys.me)) {
      queryClient.setQueryData(queryKeys.sessionExpired, true);
    }
    queryClient.setQueryData(queryKeys.me, null);
  }
};

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: (error) => handleUnauthorized(error) }),
  mutationCache: new MutationCache({
    onError: (error) => handleUnauthorized(error, true),
  }),
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
