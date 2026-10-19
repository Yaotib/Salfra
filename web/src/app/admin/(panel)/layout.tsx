// web/src/app/admin/(panel)/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="admin">
      <nav aria-label="Admin">
        {[["/admin", "Dashboard"], ["/admin/review", "Review queue"], ["/admin/sources", "Sources"], ["/admin/jobs", "Jobs and items"],
          ["/admin/audit", "Audit log"], ["/admin/settings", "Settings"]].map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
      </nav>
      <p className="meta">Signed in as {admin.email} ({admin.role})</p>
      {children}
    </div>
  );
}