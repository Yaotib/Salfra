
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

async function signIn(fd: FormData) {
  "use server";

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get("email") ?? ""),
    password: String(fd.get("password") ?? ""),
  });

  if (error) redirect("/admin/login?error=1");

  redirect("/admin");
}

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-950 text-xl font-bold tracking-tight text-white shadow-sm">
            S
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            SALFRA · Administration
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
            Welcome back
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Sign in to manage stories, sources, and the news pipeline.
          </p>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
            >
              <p className="text-sm font-semibold text-red-900">
                {error === "forbidden"
                  ? "Access not authorised"
                  : "Unable to sign in"}
              </p>
              <p className="mt-1 text-sm leading-5 text-red-800">
                {error === "forbidden"
                  ? "This account is not authorised for the admin area."
                  : "Check your email and password, then try again."}
              </p>
            </div>
          )}

          <form action={signIn} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@example.com"
                required
                className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
              />
            </div>

            <button
              type="submit"
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              Sign in
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-gray-50 p-3">
            <span className="mt-0.5 text-gray-500" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-5 w-5"
              >
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                <path d="M12 14v3" />
              </svg>
            </span>
            <p className="text-xs leading-5 text-gray-600">
              Restricted area. Access is intended for authorised SALFRA
              administrators only.
            </p>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-gray-500">
          SALFRA · AI &amp; Tech Digest
        </p>
      </div>
    </main>
  );
}
