import { ComponentType } from 'preact';

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      [key: `path`]: string;
    }
  }
}

declare module 'preact-router' {
  interface RouteProps {
    path?: string;
  }
}
