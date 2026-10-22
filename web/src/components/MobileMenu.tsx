
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const MENU_LINKS = [
  { href: "/", label: "Home" },
  { href: "/region/ghana", label: "Ghana" },
  { href: "/region/africa", label: "Africa" },
  { href: "/about", label: "About SALFRA" },
  { href: "/methodology", label: "Methodology & AI disclosure" },
  { href: "/corrections", label: "Corrections" },
  { href: "/sources", label: "Sources" },
  { href: "/contact", label: "Contact" },
  { href: "/feed.xml", label: "RSS Feed" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-800 transition-colors hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 md:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] md:hidden"
            style={{
              height: "100vh",
              isolation: "isolate",
            }}
          >
            <div
              className="absolute inset-0 h-full w-full"
              style={{ height: "100dvh" }}
            >
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={closeMenu}
                className="absolute inset-0 h-full w-full bg-gray-950/50"
              />

              <aside
                id="mobile-navigation"
                aria-label="Mobile navigation"
                aria-modal="true"
                role="dialog"
                className="absolute inset-y-0 right-0 flex h-full w-[min(88vw,360px)] flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl"
                style={{
                  height: "100%",
                  maxHeight: "100%",
                  paddingBottom: "env(safe-area-inset-bottom)",
                }}
              >
                <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      SALFRA
                    </p>
                    <p className="mt-1 text-lg font-bold tracking-tight text-gray-950">
                      Explore
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeMenu}
                    aria-label="Close navigation menu"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path d="m6 6 12 12" />
                      <path d="M18 6 6 18" />
                    </svg>
                  </button>
                </div>

                <nav
                  aria-label="Mobile site navigation"
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
                >
                  <div className="space-y-1">
                    {MENU_LINKS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className="flex min-h-12 items-center rounded-lg px-4 py-3 text-sm font-medium leading-5 text-gray-700 no-underline transition-colors hover:bg-gray-100 hover:text-blue-700 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-700"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </nav>

                <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-5 py-4">
                  <p className="text-xs leading-5 text-gray-500">
                    AI and technology news, curated and summarised.
                  </p>
                </div>
              </aside>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
