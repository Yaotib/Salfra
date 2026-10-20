
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MfaPage() {
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initializeMfa() {
      setLoading(true);
      setMsg("");

      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.listFactors();

        if (error) {
          if (!cancelled) {
            setMsg("Could not load your authentication factors. Please try again.");
          }
          return;
        }

        const verified = data?.totp?.find(
          (factor) => factor.status === "verified",
        );

        if (verified) {
          if (!cancelled) {
            setFactorId(verified.id);
            setAlreadyVerified(true);
          }
          return;
        }

        const { data: enrolled, error: enrollError } =
          await supabase.auth.mfa.enroll({
            factorType: "totp",
          });

        if (enrollError || !enrolled) {
          if (!cancelled) {
            setMsg(
              enrollError?.message ??
                "MFA enrollment could not be started. Please try again.",
            );
          }
          return;
        }

        if (!cancelled) {
          setFactorId(enrolled.id);
          setQr(enrolled.totp.qr_code);
          setSecret(enrolled.totp.secret);
        }
      } catch {
        if (!cancelled) {
          setMsg("Something went wrong while setting up MFA. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initializeMfa();

    return () => {
      cancelled = true;
    };
  }, []);

  async function verify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!factorId || !/^\d{6}$/.test(code)) {
      setMsg("Enter a valid six-digit authenticator code.");
      return;
    }

    setVerifying(true);
    setMsg("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });

      if (error) {
        setMsg("That code was not accepted. Check your authenticator and try again.");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setMsg("Verification failed due to an unexpected error. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-lg">
        <header className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-950 text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            SALFRA · Account security
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950">
            Two-factor authentication
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">
            Add an extra layer of protection to your administrator account with
            an authenticator app.
          </p>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {loading ? (
            <div
              className="py-12 text-center"
              role="status"
              aria-live="polite"
            >
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
              <p className="mt-4 text-sm text-gray-600">
                Preparing your security setup...
              </p>
            </div>
          ) : alreadyVerified ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-7 w-7"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              </div>

              <h2 className="mt-4 text-xl font-semibold text-gray-950">
                Authenticator already configured
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Enter a code from your authenticator app to verify your
                identity and continue.
              </p>
            </div>
          ) : qr ? (
            <>
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                  1
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Scan the QR code
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-gray-600">
                    Open your authenticator app and scan the code below.
                  </p>
                </div>
              </div>

              <div className="flex justify-center rounded-2xl border border-gray-100 bg-white p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt="QR code for your authenticator app"
                  width={220}
                  height={220}
                  className="h-[220px] w-[220px] max-w-full object-contain"
                />
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 p-4">
                <p className="text-sm font-semibold text-gray-900">
                  Can't scan the code?
                </p>
                <p className="mt-1 text-sm leading-5 text-gray-600">
                  You can enter the setup key manually in your authenticator
                  app.
                </p>

                <button
                  type="button"
                  onClick={() => setShowSecret((current) => !current)}
                  className="mt-3 text-sm font-semibold text-gray-800 underline underline-offset-4 hover:text-black"
                >
                  {showSecret ? "Hide setup key" : "Show setup key"}
                </button>

                {showSecret && (
                  <p className="mt-3 break-all rounded-lg bg-gray-50 p-3 font-mono text-sm text-gray-800">
                    {secret}
                  </p>
                )}

                <p className="mt-3 text-xs leading-5 text-amber-800">
                  Keep your setup key private. Anyone who obtains it may be
                  able to generate your authentication codes.
                </p>
              </div>

              <div className="mb-5 mt-6 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                  2
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    Verify your authenticator
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-gray-600">
                    Enter the current six-digit code generated by your app.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-5">
              <p className="text-sm leading-6 text-gray-700">
                MFA setup could not be completed. Review the message below and
                try again.
              </p>
            </div>
          )}

          {!loading && (
            <form onSubmit={verify} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="mfa-code"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  Authentication code
                </label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    if (msg) setMsg("");
                  }}
                  required
                  disabled={!factorId || verifying}
                  aria-describedby="mfa-code-help"
                  className="min-h-14 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-gray-950 outline-none transition placeholder:text-gray-300 focus:border-gray-500 focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
                <p id="mfa-code-help" className="mt-2 text-xs text-gray-500">
                  Enter all six digits without spaces.
                </p>
              </div>

              {msg && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
                >
                  {msg}
                </div>
              )}

              <button
                type="submit"
                disabled={!factorId || code.length !== 6 || verifying}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {verifying ? "Verifying..." : "Verify and continue"}
                {!verifying && <span aria-hidden="true">→</span>}
              </button>
            </form>
          )}
        </section>

        <p className="mt-6 text-center text-xs leading-5 text-gray-500">
          SALFRA · AI &amp; Tech Digest
        </p>
      </div>
    </main>
  );
}
