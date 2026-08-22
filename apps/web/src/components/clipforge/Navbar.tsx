"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ClipForgeLogo } from "./Logo";

const links = [
  { href: "#fitur", label: "Fitur" },
  { href: "#cara-kerja", label: "Cara Kerja" },
  { href: "#harga", label: "Harga" },
  { href: "#faq", label: "FAQ" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#05060B]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/home" className="flex items-center gap-2.5">
          <ClipForgeLogo />
        </Link>

        <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm text-slate-200 transition-colors hover:text-white"
          >
            Masuk
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.35)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
          >
            Daftar Gratis
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-white md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/[0.06] bg-[#05060B]/95 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex gap-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full border border-white/15 px-4 py-2.5 text-center text-sm font-medium"
              >
                Masuk
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2.5 text-center text-sm font-semibold text-white"
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
