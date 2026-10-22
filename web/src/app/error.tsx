
"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      role="alert"
      className="flex min-h-[60vh] items-center justify-center px-5 py-16"
    >
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          SALFRA / Error
        </p>

        <div
          aria-hidden="true"
          className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl font-semibold text-gray-500"
        >
          !
        </div>

        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
          Something went wrong
        </h1>

        <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
          This page could not be loaded. Please try again. If the problem
          continues, come back in a little while.
        </p>

        {error.digest && (
          <p className="mt-3 text-xs text-gray-400">
            Reference: {error.digest}
          </p>
        )}

        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex items-center justify-center rounded-full bg-gray-950 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
