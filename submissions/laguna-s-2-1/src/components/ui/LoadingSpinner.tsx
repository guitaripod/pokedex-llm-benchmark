import { h } from 'preact';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  class?: string;
}

export function LoadingSpinner({ size = 'md', class: className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div class={`inline-block animate-spin rounded-full border-4 border-gray-300 border-t-pokemon-red dark:border-gray-600 dark:border-t-pokemon-red ${sizeClasses[size]} ${className}`}>
      <span class="sr-only">Loading...</span>
    </div>
  );
}

export function LoadingDots({ class: className = '' }: { class?: string }) {
  return (
    <div class={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          class="w-2 h-2 bg-pokemon-red rounded-full animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}

export function LoadingSkeleton({ class: className = '', lines = 1 }: { class?: string; lines?: number }) {
  return (
    <div class={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          class="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 last:mb-0"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

export function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div class="min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
      <div class="text-red-500 mb-4">
        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold mb-2">Something went wrong</h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
      <button
        onClick={reset}
        class="px-4 py-2 bg-pokemon-red text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
