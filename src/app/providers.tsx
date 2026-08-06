import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from '../api/queryClient';
import { ToastProvider } from '../design-system/Toast';
import { AuthBootstrap } from './AuthBootstrap';
import { ErrorBoundary } from './ErrorBoundary';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <AuthBootstrap>{children}</AuthBootstrap>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
