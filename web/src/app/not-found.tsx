
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
          SALFRA / 404
        </p>

        <p
          aria-hidden="true"
          className="mt-5 text-7xl font-extrabold tracking-tighter text-gray-200 sm:text-8xl"
        >
          404
        </p>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-gray-950 sm:text-3xl">
          This page can’t be found
        </h1>

        <p className="mt-3 text-sm leading-7 text-gray-600 sm:text-base">
          The page may have moved, the link may be incorrect, or the story
          may no longer be available.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/stories"
            className="inline-flex items-center justify-center rounded-full bg-gray-950 px-6 py-3 text-sm font-bold text-white no-underline transition-colors hover:bg-blue-700 hover:no-underline"
          >
            Explore latest stories
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 no-underline transition-colors hover:bg-gray-100 hover:no-underline"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
