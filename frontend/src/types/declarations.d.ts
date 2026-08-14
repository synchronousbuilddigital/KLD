/// <reference types="vite/client" />
// Global TypeScript Module Declarations for Keyline Design
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Allow untyped JS/JSX imports across the codebase
declare module '*';
