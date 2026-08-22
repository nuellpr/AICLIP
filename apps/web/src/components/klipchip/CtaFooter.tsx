"use client";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Reveal } from "./Reveal";
import { KlipChipLogo } from "./Logo";

export function CtaFooter() {
  return (
    <>
      <section id="cta" className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-500 via-teal-500 to-lime-400 p-[1.5px]">
            <div className="rounded-[26px] bg-[#0A0B0F] px-6 py-8 sm:px-10 sm:py-10 text-center relative overflow-hidden">
              <div className="pointer-events-none absolute -right-20 -top-20 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-cyan-400/20 to-lime-400/20 blur-3xl" />
              <h2 className="relative text-[28px] font-black tracking-tighter text-white sm:text-[36px]">Siap panen Shorts minggu ini?</h2>
              <p className="relative mx-auto mt-2 max-w-[640px] text-sm leading-6 text-white/60">Paste link YouTube pertamamu. 47 detik kemudian klip vertikal + caption siap upload.</p>
              <div className="relative mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/login" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-black hover:bg-white/90 transition">Mulai Sekarang, Gratis <ArrowRight className="h-4 w-4" /></Link>
                <a href="mailto:hello@klipchip.id" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-bold text-white hover:bg-white/[0.08] transition"><Mail className="h-4 w-4" /> Hubungi tim</a>
              </div>
              <p className="relative mt-3 text-xs font-medium text-white/30">Tanpa kartu kredit • Batalkan kapan saja</p>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-white/10 bg-[#07080B]">
        <div className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <KlipChipLogo />
            <div className="flex flex-wrap gap-5 text-sm font-medium text-white/45">
              <a href="#cara-kerja" className="hover:text-white">Cara kerja</a>
              <a href="#fitur" className="hover:text-white">Fitur</a>
              <a href="#harga" className="hover:text-white">Harga</a>
              <Link href="/login" className="hover:text-white">Masuk</Link>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 border-t border-white/5 pt-6 text-xs leading-5 text-white/30 sm:flex-row sm:justify-between">
            <span>© 2026 KlipChip · Instant Clip. Built for creators.</span>
            <span className="font-mono">pipeline: download → transcribe → highlight → crop 9:16 → burn caption</span>
          </div>
        </div>
      </footer>
    </>
  );
}
