
"use client";

import { useEffect, useRef, useState } from "react";

export type ThemeMode = "light" | "eye-protection" | "dark";

const THEMES: {
  value: ThemeMode;
  label: string;
  icon: string;
}[] = [
  { value: "light", label: "Light", icon: "☀" },
  { value: "eye-protection", label: "Eye protection", icon: "▤" },
  { value: "dark", label: "Dark", icon: "☾" },
];

function isTheme(value: string | null): value is ThemeMode {
  return (
    value === "light" ||
    value === "eye-protection" ||
    value === "dark"
  );
}

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>("light");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    try {
      const saved = localStorage.getItem("salfra-theme");

      if (isTheme(saved)) {
        setCurrentTheme(saved);
        document.documentElement.setAttribute("data-theme", saved);
      } else {
        const initialTheme: ThemeMode =
          window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

        setCurrentTheme(initialTheme);
        document.documentElement.setAttribute("data-theme", initialTheme);
      }
    } catch {
      // The layout's initial theme script remains the fallback.
    }

    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function selectTheme(mode: ThemeMode) {
    setCurrentTheme(mode);
    document.documentElement.setAttribute("data-theme", mode);

    try {
      localStorage.setItem("salfra-theme", mode);
    } catch {
      // Theme still applies for the current page.
    }

    setOpen(false);
  }

  const activeTheme = THEMES.find(
    (theme) => theme.value === currentTheme
  ) ?? THEMES[0];

  return (
    <div className="theme-menu" ref={containerRef}>
      <button
        type="button"
        className="theme-menu-trigger"
        aria-label={`Appearance: ${activeTheme.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        <span aria-hidden="true">
          {mounted ? activeTheme.icon : "◐"}
        </span>
      </button>

      {open && (
        <div
          className="theme-menu-dropdown"
          role="menu"
          aria-label="Choose appearance"
        >
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              role="menuitemradio"
              aria-checked={currentTheme === theme.value}
              className="theme-menu-option"
              onClick={() => selectTheme(theme.value)}
            >
              <span aria-hidden="true">{theme.icon}</span>
              <span>{theme.label}</span>
              {currentTheme === theme.value && (
                <span className="theme-menu-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
