
export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Loading content"
      className="flex min-h-[50vh] items-start justify-center px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 border-b border-gray-200 pb-5">
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-700 motion-reduce:animate-none"
          />

          <p className="text-sm font-semibold text-gray-700">
            Loading stories...
          </p>
        </div>

        <div
          aria-hidden="true"
          className="space-y-5 py-6"
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="border-b border-gray-100 pb-5"
            >
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100 motion-reduce:animate-none" />

              <div className="mt-4 h-5 w-full max-w-lg animate-pulse rounded bg-gray-200 motion-reduce:animate-none" />

              <div className="mt-3 h-3 w-full max-w-xl animate-pulse rounded bg-gray-100 motion-reduce:animate-none" />

              <div className="mt-2 h-3 w-4/5 max-w-md animate-pulse rounded bg-gray-100 motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
