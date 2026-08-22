import type { Metadata } from "next";
import { Navbar } from "@/components/klipchip/Navbar";
import { Hero } from "@/components/klipchip/Hero";
import { ProblemSolution } from "@/components/klipchip/ProblemSolution";
import { HowItWorks } from "@/components/klipchip/HowItWorks";
import { Features } from "@/components/klipchip/Features";
import { BeforeAfter } from "@/components/klipchip/BeforeAfter";
import { Pricing } from "@/components/klipchip/Pricing";
import { CtaFooter } from "@/components/klipchip/CtaFooter";

export const metadata: Metadata = {
  title: "KlipChip · Instant Clip | Long video jadi Short viral otomatis",
  description: "KlipChip (Instant Clip) ubah video long-form jadi short vertikal 9:16 otomatis: download → transcribe faster-whisper → deteksi highlight → crop → burn caption.",
  openGraph: {
    title: "KlipChip · Instant Clip",
    description: "Long video → Short viral dalam detik. AI highlight, crop 9:16, burn caption otomatis.",
    type: "website",
  },
};

export default function KlipChipPage() {
  return (
    <div className="min-h-screen bg-[#0A0B0F] text-white antialiased selection:bg-cyan-400 selection:text-black">
      {/* a11y skip */}
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <Features />
        <BeforeAfter />
        <Pricing />
        <CtaFooter />
      </main>
    </div>
  );
}
