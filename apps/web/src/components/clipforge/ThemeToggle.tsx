"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem("cf-theme", dark ? "dark" : "light");
  } catch {
    /* private mode */
  }
}

export default function ThemeToggle({ label = false }: { label?: boolean }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("cf-theme");
    } catch {
      /* ignore */
    }
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-9 w-9" aria-hidden />;

  return (
    <button
      type="button"
      aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      onClick={() => {
        const next = !dark;
        setDark(next);
        applyTheme(next);
      }}
      className={`flex items-center justify-center gap-2 rounded-full border border-[var(--db-line)] bg-[var(--db-panel)] px-3.5 py-2 text-sm font-medium text-[var(--ink)] shadow-sm transition-colors hover:bg-[var(--db-cream)] hover:text-[#EA4C89]`}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      {label && <span>{dark ? "Mode Terang" : "Mode Gelap"}</span>}
    </button>
  );
}
