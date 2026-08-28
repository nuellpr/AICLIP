"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { ClipForgeLogo } from "./Logo";

export default function CtaFooter() {
  return (
    <>
      <section className="relative px-5 pb-24 lg:px-8">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0D0C22] p-10 text-center sm:p-16">
            <div className="cf-blob-1 pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-[#EA4C89]/25 blur-[90px]" aria-hidden="true" />
            <div className="cf-blob-2 pointer-events-none absolute -right-16 -bottom-24 h-72 w-72 rounded-full bg-[#E7E4F9]/20 blur-[100px]" aria-hidden="true" />
            <div className="cf-blob-3 pointer-events-none absolute top-1/3 left-1/2 h-52 w-52 rounded-full bg-[#EA4C89]/15 blur-[80px]" aria-hidden="true" />
            <h2 className="relative text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Siap Mengubah Konten Anda Menjadi{" "}
              <span className="text-[#EA4C89]">Viral?</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/70">
              Mulai proyek pertama Anda dan lihat sendiri 10 menit video jadi puluhan
              klip siap upload, gratis tanpa kartu kredit.
            </p>
            <Link
              href="/login"
              className="cf-cta-pulse relative mt-8 inline-flex items-center gap-2 rounded-full bg-[#EA4C89] px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:scale-[1.03] hover:bg-[#C32361]"
            >
              Mulai Buat Proyek Pertama
              <ArrowRight size={18} />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-[var(--db-line)] bg-[var(--db-panel)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2.5">
            <ClipForgeLogo compact size="sm" />
            <span className="text-sm font-semibold text-[var(--ink)]">ClipForge AI</span>
          </div>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <p className="text-xs text-[var(--db-gray)]">
              © 2026 ClipForge AI · Auto Viral Clipping. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-[var(--db-gray)]">
              <Link href="/bantuan" className="transition-colors hover:text-[#EA4C89]">
                Bantuan
              </Link>
              <Link href="/terms" className="transition-colors hover:text-[#EA4C89]">
                Syarat Layanan
              </Link>
              <Link href="/privacy" className="transition-colors hover:text-[#EA4C89]">
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
