// web/src/app/admin/login/page.tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

async function signIn(fd: FormData) {
  "use server";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? ""),
  });
  if (error) redirect("/admin/login?error=1");
  redirect("/admin");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <>
      <h1>Admin sign in</h1>
      {error && <p role="alert" className="notice">{error === "forbidden" ? "This account is not authorised for the admin area." : "Sign-in failed."}</p>}
      <form action={signIn}>
        <p><label>Email <input type="email" name="email" autoComplete="username" required /></label></p>
        <p><label>Password <input type="password" name="password" autoComplete="current-password" required /></label></p>
        <button type="submit">Sign in</button>
      </form>
    </>
  );
}