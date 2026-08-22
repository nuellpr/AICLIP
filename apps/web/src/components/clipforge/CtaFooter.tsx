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
          <div className="gradient-border relative overflow-hidden rounded-[2rem] p-10 text-center sm:p-16">
            <div className="cf-mesh" aria-hidden="true" />
            <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-5xl">
              Siap Mengubah Konten Anda Menjadi{" "}
              <span className="text-gradient-blue">Viral?</span>
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-slate-400">
              Mulai proyek pertama Anda dan lihat sendiri 10 menit video jadi puluhan
              klip siap upload, gratis tanpa kartu kredit.
            </p>
            <Link
              href="/login"
              className="cf-cta-pulse relative mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-8 py-4 text-base font-bold text-white transition-transform duration-300 hover:scale-[1.03]"
            >
              Mulai Buat Proyek Pertama
              <ArrowRight size={18} />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/[0.06] bg-[#04050A]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2.5">
            <ClipForgeLogo compact size="sm" />
            <span className="text-sm font-semibold text-slate-300">ClipForge AI</span>
          </div>
          <p className="text-xs text-slate-500">
            © 2026 ClipForge AI · Auto Viral Clipping. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
