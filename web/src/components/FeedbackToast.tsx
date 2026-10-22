"use client";

import { useState, useEffect } from "react";

export function FeedbackToast({ initialMessage }: { initialMessage?: string }) {
  const [message, setMessage] = useState<string | undefined>(initialMessage);

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
      // Clean up the ?msg= query parameter from URL so it doesn't linger on page reload
      if (typeof window !== "undefined" && window.location.search.includes("msg=")) {
        const url = new URL(window.location.href);
        url.searchParams.delete("msg");
        window.history.replaceState(
          {},
          "",
          url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "")
        );
      }
    }
  }, [initialMessage]);

  if (!message) return null;

  const isError = message.toLowerCase().startsWith("error");

  return (
    <div
      role="status"
      className={`toast-feedback ${isError ? "notice-warning" : ""}`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {isError ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )}
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={() => setMessage(undefined)}
        style={{
          background: "transparent",
          border: "none",
          color: "inherit",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "1.2rem",
          lineHeight: "1",
        }}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
