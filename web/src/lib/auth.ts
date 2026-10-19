// web/src/lib/auth.ts
import { redirect } from "next/navigation";
import { sql } from "./db";
import { createClient } from "./supabase/server";

export type Role = "owner" | "editor" | "sources";
export type AdminUser = { id: string; email: string; role: Role };

/** Owner can do everything. Others need to be listed in `allowed`. */
export async function requireAdmin(allowed: Role[] = ["editor", "sources"]): Promise<AdminUser> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (process.env.REQUIRE_MFA === "1") {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") redirect("/admin/mfa");
  }

const dbCheck = await sql<{
  current_database: string;
  current_user: string;
  admin_count: number;
}[]>`
  SELECT
    current_database() AS current_database,
    current_user AS current_user,
    (SELECT count(*)::int FROM public.admins) AS admin_count
`;

console.log("SALFRA database connection check:", dbCheck[0]);

  const rows = await sql<{ role: Role }[]>`
  select role
  from public.admins
  where user_id = ${user.id}
`;


const role = rows[0]?.role;

console.log("Admin authorization check:", {
  userId: user.id,
  email: user.email,
  adminRecordFound: rows.length > 0,
  role: role ?? null,
  allowedRoles: allowed,
});

if (!role || (role !== "owner" && !allowed.includes(role))) {
  redirect("/admin/login?error=forbidden");
}
  return { id: user.id, email: user.email ?? "unknown", role };
}