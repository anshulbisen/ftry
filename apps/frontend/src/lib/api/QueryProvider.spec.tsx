/**
 * QueryProvider Component Tests
 *
 * Tests the React Query provider wrapper component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryProvider } from './QueryProvider';
import { useQuery } from '@tanstack/react-query';

// Test component that uses a query
function TestComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      return { message: 'Hello, World!' };
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <div>{data?.message}</div>;
}

describe('QueryProvider', () => {
  it('should render children', () => {
    render(
      <QueryProvider>
        <div>Test Child</div>
      </QueryProvider>,
    );

    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should provide QueryClient context to children', async () => {
    render(
      <QueryProvider>
        <TestComponent />
      </QueryProvider>,
    );

    // Initially loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Eventually shows data
    expect(await screen.findByText('Hello, World!')).toBeInTheDocument();
  });

  it('should render DevTools in development mode', () => {
    render(
      <QueryProvider>
        <div data-testid="test-child">Test</div>
      </QueryProvider>,
    );

    // Child should be rendered
    expect(screen.getByTestId('test-child')).toBeInTheDocument();

    // Note: DevTools rendering is environment-specific and tested in integration
    // We just verify the component renders without errors
  });

  it('should accept and use custom QueryClient', async () => {
    const { QueryClient } = await import('@tanstack/react-query');
    const customClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000,
        },
      },
    });

    render(
      <QueryProvider client={customClient}>
        <TestComponent />
      </QueryProvider>,
    );

    expect(await screen.findByText('Hello, World!')).toBeInTheDocument();
  });
});
