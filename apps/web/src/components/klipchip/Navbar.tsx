"use client";
import Link from "next/link";
import { KlipChipLogo } from "./Logo";
import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#0A0B0F]/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[64px] max-w-[1160px] items-center justify-between px-4 sm:px-6">
        <Link href="/klipchip" className="shrink-0">
          <KlipChipLogo />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          <a href="#cara-kerja" className="text-sm font-medium text-white/65 hover:text-white transition-colors">Cara kerja</a>
          <a href="#fitur" className="text-sm font-medium text-white/65 hover:text-white transition-colors">Fitur</a>
          <a href="#demo" className="text-sm font-medium text-white/65 hover:text-white transition-colors">Demo</a>
          <a href="#harga" className="text-sm font-medium text-white/65 hover:text-white transition-colors">Harga</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex rounded-full px-4 py-2 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/5 transition">
            Masuk
          </Link>
          <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-lime-400 px-5 py-2.5 text-sm font-black text-black shadow-[0_8px_24px_rgba(34,211,238,0.35)] hover:opacity-95 hover:scale-[1.02] transition">
            Coba Gratis
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
