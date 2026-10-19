// web/src/app/admin/mfa/page.tsx
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MfaPage() {
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (verified) { setFactorId(verified.id); return; }
      const { data: enrolled, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error || !enrolled) { setMsg(error?.message ?? "Enrollment failed"); return; }
      setFactorId(enrolled.id); setQr(enrolled.totp.qr_code); setSecret(enrolled.totp.secret);
    })();
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) setMsg("That code was not accepted."); else window.location.href = "/admin";
  }

  return (
    <>
      <h1>Two-factor authentication</h1>
      {qr && (<><p>Scan this with an authenticator app, then enter the 6-digit code.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}<img src={qr} alt="QR code for your authenticator app" width={200} height={200} />
        <p className="meta">Or enter this key manually: {secret}</p></>)}
      <form onSubmit={verify}>
        <label>Code <input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} /></label>{" "}
        <button type="submit" disabled={!factorId}>Verify</button>
      </form>
      {msg && <p role="alert">{msg}</p>}
    </>
  );
}