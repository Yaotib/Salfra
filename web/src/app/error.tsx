// web/src/app/error.tsx
"use client";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (<div role="alert"><h1>Something went wrong</h1><p>This page could not be loaded. Published stories are not affected. Please try again.</p><button onClick={reset}>Try again</button></div>);
}