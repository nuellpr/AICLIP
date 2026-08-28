"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut, Menu, Settings, X } from "lucide-react";
import { ClipForgeLogo } from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { clearAuthSession, getStoredToken, getStoredUser, type AuthUser } from "@/lib/auth";

const links = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

function UserMenu({ user, onNavigate, onLogout }: { user: AuthUser; onNavigate?: () => void; onLogout?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const initial = (user.name || user.email || "?").trim().charAt(0).toUpperCase();

  const logout = () => {
    clearAuthSession();
    setOpen(false);
    onLogout?.();
    router.push("/home");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu profil"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-[var(--db-line)] bg-[var(--db-panel)] py-1 pl-1 pr-1 transition-shadow hover:shadow-md md:pr-3"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EA4C89] text-sm font-bold text-white">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-[var(--ink)] md:block">
          {user.name || user.email}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--db-line)] bg-[var(--db-panel)] py-1 shadow-lg">
          <div className="border-b border-[var(--db-line)] px-3 py-2">
            <p className="truncate text-sm font-semibold text-[var(--ink)]">{user.name || "Kreator"}</p>
            <p className="truncate text-xs text-[var(--db-gray)]">{user.email}</p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => { setOpen(false); onNavigate?.(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--db-cream)] hover:text-[#EA4C89]"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => { setOpen(false); onNavigate?.(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--ink)] hover:bg-[var(--db-cream)] hover:text-[#EA4C89]"
          >
            <Settings size={15} />
            Pengaturan
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#B42318] hover:bg-[var(--db-cream)]"
          >
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const authed = !!user && !!getStoredToken();

  const handleLogout = () => setUser(null);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--db-line)] bg-[var(--db-nav)] backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/home" className="flex items-center gap-2.5">
          <ClipForgeLogo />
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-[var(--ink)] md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-[#EA4C89]">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {authed && user ? (
            <UserMenu user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:text-[#EA4C89]"
              >
                Masuk
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-[#0D0C22] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#EA4C89]"
              >
                Daftar Gratis
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-[var(--ink)] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-[var(--db-line)] bg-[var(--db-panel)]/95 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-[var(--ink)] hover:bg-[var(--db-cream)] hover:text-[#EA4C89]"
              >
                {l.label}
              </a>
            ))}
            {authed && user ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="flex-1">
                  <ThemeToggle />
                </span>
                <div className="flex-1 [&>div]:w-full [&_button]:w-full [&_button]:justify-center">
                  <UserMenu user={user} onNavigate={() => setOpen(false)} onLogout={() => { setOpen(false); handleLogout(); }} />
                </div>
              </div>
            ) : (
              <div className="mt-3 flex gap-3">
                <span className="flex-1">
                  <ThemeToggle />
                </span>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border border-[var(--db-line)] px-4 py-2.5 text-center text-sm font-medium text-[var(--ink)]"
                >
                  Masuk
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full bg-[#0D0C22] px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Daftar Gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
