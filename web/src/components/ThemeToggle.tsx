"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "eye-protection" | "dark";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("salfra-theme") as ThemeMode | null;
      if (saved && (saved === "light" || saved === "eye-protection" || saved === "dark")) {
        setCurrentTheme(saved);
        applyTheme(saved);
      } else {
        // Fall back to system preference when no manual preference is saved
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: ThemeMode = isDark ? "dark" : "light";
        setCurrentTheme(initialTheme);
        applyTheme(initialTheme);
      }
    } catch (err) {
      console.warn("Could not read theme preference from storage:", err);
    }

    // Listen for system theme changes if no manual preference has been stored
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const manual = localStorage.getItem("salfra-theme");
        if (!manual) {
          const newTheme: ThemeMode = e.matches ? "dark" : "light";
          setCurrentTheme(newTheme);
          applyTheme(newTheme);
        }
      } catch (err) {
        console.warn("Storage check failed on system theme change:", err);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  function applyTheme(mode: ThemeMode) {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", mode);
  }

  function handleSelect(mode: ThemeMode) {
    setCurrentTheme(mode);
    try {
      localStorage.setItem("salfra-theme", mode);
    } catch (err) {
      console.warn("Could not persist theme preference to localStorage:", err);
    }
    applyTheme(mode);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const modes: ThemeMode[] = ["light", "eye-protection", "dark"];
    const currentIndex = modes.indexOf(currentTheme);
    if (currentIndex === -1) return;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % modes.length;
      handleSelect(modes[nextIndex]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + modes.length) % modes.length;
      handleSelect(modes[prevIndex]);
    }
  }

  return (
    <div
      className="theme-switcher"
      role="radiogroup"
      aria-label="Display appearance settings"
      title="Display appearance: Light, Eye Protection, or Dark mode"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        role="radio"
        aria-checked={mounted && currentTheme === "light"}
        aria-label="Light mode"
        className={`theme-btn ${mounted && currentTheme === "light" ? "active" : ""}`}
        onClick={() => handleSelect("light")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <span className="theme-label">Light</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={mounted && currentTheme === "eye-protection"}
        aria-label="Eye protection mode (soft paper contrast)"
        className={`theme-btn ${mounted && currentTheme === "eye-protection" ? "active" : ""}`}
        onClick={() => handleSelect("eye-protection")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
        <span className="theme-label">Eye Comfort</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={mounted && currentTheme === "dark"}
        aria-label="Dark mode"
        className={`theme-btn ${mounted && currentTheme === "dark" ? "active" : ""}`}
        onClick={() => handleSelect("dark")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <span className="theme-label">Dark</span>
      </button>
    </div>
  );
}
