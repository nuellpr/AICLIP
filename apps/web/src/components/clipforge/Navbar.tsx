"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ClipForgeLogo } from "./Logo";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
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
          </div>
        </div>
      )}
    </header>
  );
}
