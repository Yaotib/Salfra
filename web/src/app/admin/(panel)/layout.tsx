
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/review", label: "Review queue" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/jobs", label: "Jobs and items" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] bg-gray-50 px-4 py-5 text-gray-950 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <Link
              href="/admin"
              className="mb-7 block rounded-lg no-underline"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                SALFRA
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-gray-950">
                Admin workspace
              </p>
              <p className="mt-1 text-sm text-gray-500">
                AI &amp; Tech Digest
              </p>
            </Link>

            <nav aria-label="Admin navigation" className="space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Workspace
              </p>

              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 no-underline transition-colors hover:bg-gray-100 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 border-t border-gray-100 pt-4 lg:mt-auto">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Signed in as
              </p>
              <div className="mt-2 rounded-xl bg-gray-50 p-3">
                <p className="break-all text-sm font-medium text-gray-900">
                  {admin.email}
                </p>
                <p className="mt-1 text-xs capitalize text-gray-500">
                  {admin.role}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <main className="min-h-[calc(100vh-2.5rem)] rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
